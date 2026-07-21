import { createAdminClient } from "@/lib/supabase/admin";
import { scoutIdeas } from "./agents/idea-scout";
import { buildBrief } from "./agents/strategist";
import { research } from "./agents/researcher";
import { writeArticle, reviseArticle } from "./agents/writer";
import { editArticle, APPROVE_THRESHOLD } from "./agents/editor";
import { generateSeoMeta } from "./agents/seo";
import { critiqueRun } from "./agents/critic";
import { makeStepRunner } from "./run-steps";
import { blogPostFromRow } from "./types";
import type { Review, Idea } from "./types";

const MAX_REVISION_ROUNDS = 2;

/**
 * Orchestrator is plain code, not an agent — order, the revision loop, and
 * the publish/draft gate must be predictable and debuggable. Only the
 * creative and judgment steps (idea, brief, research, writing, editing, SEO
 * copy, critique) are delegated to LLM calls.
 *
 * Flow: idea-scout -> strategist -> researcher -> writer <-> editor
 * (max 2 revision rounds) -> seo -> publisher (code) -> critic
 * (self-improvement, best-effort).
 */
export async function runBlogPipeline(opts: { runId: string; topicHint: string | null }): Promise<void> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(opts.runId);

  const { data: existing } = await admin.from("blog_posts").select("title, slug").limit(50);
  const existingTitles = (existing ?? []).map((p) => p.title);
  const existingSlugs = (existing ?? []).map((p) => p.slug);

  // ── 1. Idea Scout ──
  const ideas: Idea[] = await step("idea-scout", async () => {
    const out = await scoutIdeas({ existingTitles, topicHint: opts.topicHint });
    const best = [...out].sort((a, b) => b.score - a.score)[0];
    return { output: out, summary: `${out.length} ideas generated; best: "${best.title}"` };
  });

  // ── 2. Strategist ──
  const brief = await step("strategist", async () => {
    const out = await buildBrief({ ideas, topicHint: opts.topicHint });
    return { output: out, summary: `brief "${out.title}" — keyword: ${out.primaryKeyword}, ${out.outline.length} sections` };
  });

  // ── 3. Researcher ──
  const researched = await step("researcher", async () => {
    const out = await research({ brief });
    const web = process.env.TAVILY_API_KEY ? " (with web search)" : " (no web search)";
    return { output: out, summary: `${out.keyFacts.length} facts, ${out.commonQuestions.length} common questions${web}` };
  });

  // ── 4 & 5. Writer <-> Editor (revision loop) ──
  let draft = await step("writer", async () => {
    const out = await writeArticle({ brief, research: researched });
    return { output: out, summary: `first draft written, ${out.split(/\s+/).length} words` };
  });

  let review: Review = await step("editor", async () => {
    const out = await editArticle({ brief, draft });
    return {
      output: out,
      summary: `score ${out.score}/100 — ${out.verdict === "approve" ? "approved" : `${out.issues.length} issue(s), needs revision`}`,
    };
  });

  let revisionRounds = 0;
  while (review.verdict === "revise" && revisionRounds < MAX_REVISION_ROUNDS) {
    revisionRounds++;
    const round = revisionRounds;

    draft = await step("writer", async () => {
      const out = await reviseArticle({ brief, research: researched, draft, review });
      return { output: out, summary: `revision ${round} based on ${review.issues.length} editor issue(s)` };
    });

    review = await step("editor", async () => {
      const out = await editArticle({ brief, draft });
      return { output: out, summary: `score ${out.score}/100 — ${out.verdict === "approve" ? "approved" : "still has issues"}` };
    });
  }
  // If still "revise" after the round cap, we continue anyway — the post
  // stays a draft so a human makes the final call (human-in-the-loop).

  // ── 6. SEO ──
  const { seo, checks } = await step("seo", async () => {
    const out = await generateSeoMeta({ brief, contentMd: draft, existingSlugs });
    const passed = out.checks.filter((c) => c.pass).length;
    return { output: out, summary: `metadata built — checklist: ${passed}/${out.checks.length} passed` };
  });

  // ── 7. Publisher (code, not an agent) ──
  const shouldPublish = review.verdict === "approve" && review.score >= APPROVE_THRESHOLD;
  const postId = await step("publisher", async () => {
    const { data: post, error } = await admin
      .from("blog_posts")
      .insert({
        run_id: opts.runId,
        title: brief.title,
        slug: seo.slug,
        excerpt: seo.excerpt,
        content_md: draft,
        meta_title: seo.metaTitle,
        meta_description: seo.metaDescription,
        keywords: seo.keywords,
        faq: seo.faq,
        score: review.score,
        status: shouldPublish ? "published" : "draft",
        published_at: shouldPublish ? new Date().toISOString() : null,
      })
      .select("id, slug, status")
      .single();
    if (error || !post) throw new Error(error?.message ?? "failed to save post");
    return {
      output: post.id as string,
      summary: shouldPublish ? `published: /blog/${post.slug}` : `saved as draft (score ${review.score} — needs human approval)`,
    };
  });

  await admin.from("blog_pipeline_runs").update({ post_id: postId }).eq("id", opts.runId);

  // ── 8. Critic (self-improvement, best-effort) ──
  // Its own failure must never fail an otherwise-successful pipeline run.
  await step("critic", async () => {
    try {
      const { data: postRow } = await admin.from("blog_posts").select("*").eq("id", postId).single();
      const post = blogPostFromRow(postRow);
      const result = await critiqueRun({ post, editorReview: review, seoChecks: checks, revisionRounds });
      return { output: result, summary: `overall score ${result.overallScore}/100 — ${result.lessonCount} lesson(s) saved for future runs` };
    } catch {
      return { output: null, summary: "lesson extraction failed (main run is unaffected)" };
    }
  });

  await admin
    .from("blog_pipeline_runs")
    .update({ status: "done", finished_at: new Date().toISOString() })
    .eq("id", opts.runId);
}
