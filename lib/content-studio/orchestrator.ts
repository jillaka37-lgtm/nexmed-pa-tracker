import { createAdminClient } from "@/lib/supabase/admin";
import { logAiCall } from "@/lib/audit";
import { estimateCostUsd } from "@/lib/ai-agents/core";
import { writeLinkedinPost } from "./agents/linkedin-writer";
import { scoutLinkedinIdea } from "./agents/idea-scout";
import { scoutCarouselIdeas } from "./agents/carousel-idea-scout";
import { buildCarouselBrief } from "./agents/carousel-strategist";
import { writeCarousel, reviseCarousel } from "./agents/carousel-writer";
import { findLinkedinAngle } from "./agents/linkedin-angle-finder";
import { writeSocialLinkedinPost, reviseSocialLinkedinPost } from "./agents/social-linkedin-writer";
import { writeReelsScript, reviseReelsScript } from "./agents/reels-writer";
import { repurposeArticle } from "./agents/repurposer";
import { availableCtas } from "./reels-cta";
import { prepareReelsSource } from "./reels-source";
import { runInstagramChecks, runLinkedinChecks, runReelsChecks } from "./social-checks";
import { writeAndReview } from "./social-loop";
import { makeStepRunner } from "./run-steps";
import { brandVoiceFromRow, type BrandVoice, type SocialIdea } from "./types";
import { blogPostFromRow } from "@/lib/blog-agents/types";

async function getBrandVoice(): Promise<BrandVoice> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("brand_voice").select("*").limit(1).single();
  if (error || !data) throw new Error("brand_voice is not configured");
  return brandVoiceFromRow(data);
}

function briefToText(input: { topics: string[]; campaign: string | null; notes: string | null }): string {
  const lines = [
    `Topics: ${input.topics.join(", ")}`,
    input.campaign ? `Current campaign: ${input.campaign}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * LinkedIn pipeline: idea-scout (if no topic given) -> writer -> save.
 * Deliberately plain async/await, not an agent — the sequence must be
 * predictable and debuggable. Every step is mirrored into
 * content_studio_runs.steps so the client can poll for live progress
 * instead of blocking on the full request.
 */
export async function runContentBrief(input: {
  runId: string;
  topics: string[];
  campaign: string | null;
  notes: string | null;
  createdBy: string | null;
}): Promise<{ briefId: string; pieceId: string }> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(input.runId);
  const brand = await getBrandVoice();

  // If staff left topics blank, the idea-scout proposes one. An explicit
  // human-given topic always wins; this only fires when there's nothing to
  // go on.
  let topics = input.topics;
  if (topics.length === 0) {
    topics = await step("idea-scout", "Idea Scout", async () => {
      const { data: recent } = await admin
        .from("content_pieces")
        .select("hook")
        .not("hook", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      const idea = await scoutLinkedinIdea({ existingHooks: (recent ?? []).map((r) => r.hook as string) });
      return { output: [idea.title], summary: `picked: "${idea.title}"` };
    });
  }

  const { data: brief, error: briefError } = await admin
    .from("content_briefs")
    .insert({ topics, campaign: input.campaign, notes: input.notes, created_by: input.createdBy })
    .select("id")
    .single();
  if (briefError || !brief) throw new Error(briefError?.message ?? "failed to save brief");

  const briefText = briefToText({ ...input, topics });

  let draft;
  let usage = { inputTokens: 0, outputTokens: 0 };
  try {
    draft = await step("linkedin-writer", "LinkedIn Copywriter", async () => {
      const result = await writeLinkedinPost({ brand, briefText });
      usage = result.usage;
      return { output: result.draft, summary: `"${result.draft.hook}"` };
    });
  } catch (err) {
    await logAiCall({
      userId: input.createdBy,
      feature: "content-studio:linkedin-writer",
      prompt: briefText,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  await logAiCall({
    userId: input.createdBy,
    feature: "content-studio:linkedin-writer",
    prompt: briefText,
    response: draft,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: estimateCostUsd(usage),
  });

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "linkedin",
        hook: draft.hook,
        body: `${draft.body}\n\n${draft.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: "saved as draft" };
  });

  await admin
    .from("content_studio_runs")
    .update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() })
    .eq("id", input.runId);

  return { briefId: brief.id, pieceId: piece.id };
}

/**
 * Standalone Instagram carousel pipeline: idea-scout -> strategist (builds
 * the shared SocialBrief) -> writer <-> editor loop (writeAndReview) ->
 * save. Ported from arkan-content-studio's carousel pipeline — the
 * strategist/writer/editor/checks split and the "OR" revision rule are the
 * load-bearing decisions, kept intact rather than simplified away.
 */
export async function runCarouselBrief(input: {
  runId: string;
  topicHint: string | null;
  createdBy: string | null;
}): Promise<{ briefId: string; pieceId: string }> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(input.runId);
  const brand = await getBrandVoice();

  const { data: existing } = await admin
    .from("content_pieces")
    .select("hook")
    .eq("platform", "carousel")
    .not("hook", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const existingTitles = (existing ?? []).map((r) => r.hook as string);

  const ideas = await step("carousel-idea-scout", "Idea Scout", async () => {
    const out = await scoutCarouselIdeas({ brand, topicHint: input.topicHint, existingTitles });
    return { output: out, summary: `${out.length} ideas; best: "${out[0]?.title}"` };
  });

  const socialBrief = await step("carousel-strategist", "Content Strategist", async () => {
    const out = await buildCarouselBrief({ brand, ideas, topicHint: input.topicHint });
    return { output: out, summary: out.coreMessage.slice(0, 100) };
  });

  const { data: brief, error: briefError } = await admin
    .from("content_briefs")
    .insert({
      topics: [ideas[0]?.title ?? input.topicHint ?? "carousel"],
      campaign: null,
      notes: `Core message: ${socialBrief.coreMessage}`,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (briefError || !brief) throw new Error(briefError?.message ?? "failed to save brief");

  let result;
  try {
    result = await writeAndReview({
      step,
      writerAgent: "carousel-writer",
      label: "Instagram",
      brand,
      channel: "carousel",
      brief: socialBrief,
      write: () => writeCarousel({ brand, brief: socialBrief }),
      revise: (draft, review, failedChecks) => reviseCarousel({ brand, brief: socialBrief, draft, review, failedChecks }),
      check: (draft) => runInstagramChecks({ caption: draft.caption, slides: draft.slides, hashtags: draft.hashtags }),
      describe: (draft) => `"${draft.title}", ${draft.slides.length} slides`,
    });
  } catch (err) {
    await logAiCall({
      userId: input.createdBy,
      feature: "content-studio:carousel",
      prompt: JSON.stringify(socialBrief),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  await logAiCall({
    userId: input.createdBy,
    feature: "content-studio:carousel",
    prompt: JSON.stringify(socialBrief),
    response: result.draft,
    costUsd: 0, // per-call token usage isn't threaded through writeAndReview yet
  });

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "carousel",
        hook: result.draft.title,
        body: result.draft.caption,
        slides: result.draft.slides,
        hashtags: result.draft.hashtags,
        extras: { cta: result.draft.cta },
        score: result.review.score,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${result.review.score}/100` };
  });

  await admin
    .from("content_studio_runs")
    .update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() })
    .eq("id", input.runId);

  return { briefId: brief.id, pieceId: piece.id };
}

async function fallbackIdeas(admin: ReturnType<typeof createAdminClient>, brand: BrandVoice): Promise<SocialIdea[]> {
  const { data: existing } = await admin
    .from("content_pieces")
    .select("hook")
    .not("hook", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  return scoutCarouselIdeas({ brand, topicHint: null, existingTitles: (existing ?? []).map((r) => r.hook as string) });
}

/**
 * Standalone LinkedIn pipeline: angle-finder (from a staff observation, or
 * idea-scout ideas as a fallback) -> writer <-> editor loop -> save.
 */
export async function runStandaloneLinkedinBrief(input: {
  runId: string;
  observation: string | null;
  createdBy: string | null;
}): Promise<{ briefId: string; pieceId: string }> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(input.runId);
  const brand = await getBrandVoice();

  const ideas = input.observation ? [] : await step("carousel-idea-scout", "Idea Scout (fallback)", async () => {
    const out = await fallbackIdeas(admin, brand);
    return { output: out, summary: `${out.length} fallback ideas generated` };
  });

  const socialBrief = await step("linkedin-angle-finder", "Angle Finder", async () => {
    const out = await findLinkedinAngle({ brand, observation: input.observation, observationIsTrusted: true, ideas });
    return { output: out, summary: out.coreMessage.slice(0, 100) };
  });

  const { data: brief, error: briefError } = await admin
    .from("content_briefs")
    .insert({
      topics: [socialBrief.coreMessage.slice(0, 80)],
      campaign: null,
      notes: input.observation ? `Observation: ${input.observation.slice(0, 200)}` : null,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (briefError || !brief) throw new Error(briefError?.message ?? "failed to save brief");

  const result = await writeAndReview({
    step,
    writerAgent: "social-linkedin-writer",
    label: "LinkedIn",
    brand,
    channel: "linkedin",
    brief: socialBrief,
    write: () => writeSocialLinkedinPost({ brand, brief: socialBrief }),
    revise: (draft, review, failedChecks) => reviseSocialLinkedinPost({ brand, brief: socialBrief, draft, review, failedChecks }),
    check: (draft) => runLinkedinChecks({ body: draft.body, hashtags: draft.hashtags }),
    describe: (draft) => `"${draft.title}"`,
  });

  await logAiCall({
    userId: input.createdBy,
    feature: "content-studio:standalone-linkedin",
    prompt: JSON.stringify(socialBrief),
    response: result.draft,
  });

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "linkedin",
        hook: result.draft.title,
        body: `${result.draft.body}\n\n${result.draft.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`,
        score: result.review.score,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${result.review.score}/100` };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() }).eq("id", input.runId);
  return { briefId: brief.id, pieceId: piece.id };
}

/**
 * Reels pipeline: prepare source (link/text, code not an agent, SSRF-
 * guarded) -> writer <-> editor loop -> save.
 */
export async function runReelsBrief(input: {
  runId: string;
  sourceUrl: string | null;
  sourceText: string | null;
  leadMagnet: string | null;
  createdBy: string | null;
}): Promise<{ briefId: string; pieceId: string }> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(input.runId);
  const brand = await getBrandVoice();

  const source = await step("reels-source", "Source Prep", async () => {
    const out = await prepareReelsSource({ sourceUrl: input.sourceUrl, sourceText: input.sourceText, trusted: true });
    return { output: out, summary: `${out.text.length} chars from ${out.origin}` };
  });

  const { data: brief, error: briefError } = await admin
    .from("content_briefs")
    .insert({ topics: [source.origin], campaign: null, notes: null, created_by: input.createdBy })
    .select("id")
    .single();
  if (briefError || !brief) throw new Error(briefError?.message ?? "failed to save brief");

  // Reels uses its own writer, not the shared writeAndReview loop's brief
  // shape (its input is a ReelsSource, not a SocialBrief) — same
  // write/check/editor sequence, wired by hand instead.
  const { runSocialEditor } = await import("./social-editor");

  let draft = await step("reels-writer", "Reels Copywriter — first draft", async () => {
    const out = await writeReelsScript({ brand, source, leadMagnet: input.leadMagnet });
    return { output: out, summary: `"${out.title}"` };
  });

  const allowedCtaIds = availableCtas(Boolean(input.leadMagnet)).map((c) => c.id);
  let checks = runReelsChecks({ ...draft, allowedCtaIds });

  const reelsBriefStandIn = () => ({
    coreMessage: draft.hook,
    audience: brand.audience,
    keyPoints: [draft.body.slice(0, 200)],
    hookAngle: draft.hook,
    proofPoint: draft.body.slice(0, 200),
    cta: draft.cta,
  });

  let review = await step("social-editor", "Social Editor — Reels", async () => {
    const out = await runSocialEditor({ brand, channel: "reels", brief: reelsBriefStandIn(), draft, failedChecks: checks.filter((c) => !c.pass) });
    const passed = checks.filter((c) => c.pass).length;
    return { output: out, summary: `score ${out.score}/100 — checklist ${passed}/${checks.length} passed` };
  });

  if (review.verdict === "revise" || checks.some((c) => !c.pass)) {
    const failed = checks.filter((c) => !c.pass);
    const previousReview = review;
    draft = await step("reels-writer", "Reels Copywriter — revision", async () => {
      const out = await reviseReelsScript({ brand, source, leadMagnet: input.leadMagnet, draft, review: previousReview, failedChecks: failed });
      return { output: out, summary: `revised based on ${previousReview.issues.length} issue(s)` };
    });
    checks = runReelsChecks({ ...draft, allowedCtaIds });
    review = await step("social-editor", "Social Editor — re-review Reels", async () => {
      const out = await runSocialEditor({ brand, channel: "reels", brief: reelsBriefStandIn(), draft, failedChecks: checks.filter((c) => !c.pass) });
      const passed = checks.filter((c) => c.pass).length;
      return { output: out, summary: `score ${out.score}/100 — checklist ${passed}/${checks.length} passed` };
    });
  }

  await logAiCall({ userId: input.createdBy, feature: "content-studio:reels", prompt: source.text.slice(0, 500), response: draft });

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "reels",
        hook: draft.title,
        body: `${draft.hook}\n\n${draft.body}\n\n${draft.cta}`,
        hashtags: draft.hashtags,
        extras: { onScreenText: draft.onScreenText, caption: draft.caption, ctaId: draft.ctaId, ctaReason: draft.ctaReason, sourceOrigin: source.origin },
        score: review.score,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${review.score}/100` };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() }).eq("id", input.runId);
  return { briefId: brief.id, pieceId: piece.id };
}

/**
 * Repurpose pipeline: published article -> repurposer builds one shared
 * SocialBrief -> carousel writer AND LinkedIn writer both run off it
 * sequentially, on the SAME run's steps array. Sequential, not parallel —
 * see the design doc note on why parallel is only safe when each branch
 * owns its own run/steps (true for campaign, not here).
 */
export async function runRepurposeBrief(input: {
  runId: string;
  postId: string;
  createdBy: string | null;
}): Promise<{ briefId: string; pieceIds: string[] }> {
  const admin = createAdminClient();
  const { step } = makeStepRunner(input.runId);
  const brand = await getBrandVoice();

  const { data: postRow, error: postError } = await admin.from("blog_posts").select("*").eq("id", input.postId).eq("status", "published").single();
  if (postError || !postRow) throw new Error("Post not found or not published.");
  const post = blogPostFromRow(postRow);

  const socialBrief = await step("repurposer", "Repurposer", async () => {
    const out = await repurposeArticle({ brand, post });
    return { output: out, summary: out.coreMessage.slice(0, 100) };
  });

  const { data: brief, error: briefError2 } = await admin
    .from("content_briefs")
    .insert({ topics: [post.title], campaign: null, notes: `Repurposed from: ${post.title}`, created_by: input.createdBy })
    .select("id")
    .single();
  if (briefError2 || !brief) throw new Error(briefError2?.message ?? "failed to save brief");

  const carouselResult = await writeAndReview({
    step,
    writerAgent: "carousel-writer",
    label: "Instagram",
    brand,
    channel: "carousel",
    brief: socialBrief,
    write: () => writeCarousel({ brand, brief: socialBrief }),
    revise: (draft, review, failedChecks) => reviseCarousel({ brand, brief: socialBrief, draft, review, failedChecks }),
    check: (draft) => runInstagramChecks({ caption: draft.caption, slides: draft.slides, hashtags: draft.hashtags }),
    describe: (draft) => `"${draft.title}", ${draft.slides.length} slides`,
  });

  const linkedinResult = await writeAndReview({
    step,
    writerAgent: "social-linkedin-writer",
    label: "LinkedIn",
    brand,
    channel: "linkedin",
    brief: socialBrief,
    write: () => writeSocialLinkedinPost({ brand, brief: socialBrief }),
    revise: (draft, review, failedChecks) => reviseSocialLinkedinPost({ brand, brief: socialBrief, draft, review, failedChecks }),
    check: (draft) => runLinkedinChecks({ body: draft.body, hashtags: draft.hashtags }),
    describe: (draft) => `"${draft.title}"`,
  });

  await logAiCall({ userId: input.createdBy, feature: "content-studio:repurpose", prompt: JSON.stringify(socialBrief), response: { carouselResult, linkedinResult } });

  const pieceIds = await step("publisher", "Publisher", async () => {
    const { data: carouselPiece, error: e1 } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "carousel",
        hook: carouselResult.draft.title,
        body: carouselResult.draft.caption,
        slides: carouselResult.draft.slides,
        hashtags: carouselResult.draft.hashtags,
        extras: { cta: carouselResult.draft.cta },
        score: carouselResult.review.score,
        status: "draft",
      })
      .select("id")
      .single();
    if (e1 || !carouselPiece) throw new Error(e1?.message ?? "failed to save carousel");

    const { data: linkedinPiece, error: e2 } = await admin
      .from("content_pieces")
      .insert({
        brief_id: brief.id,
        platform: "linkedin",
        hook: linkedinResult.draft.title,
        body: `${linkedinResult.draft.body}\n\n${linkedinResult.draft.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`,
        score: linkedinResult.review.score,
        status: "draft",
      })
      .select("id")
      .single();
    if (e2 || !linkedinPiece) throw new Error(e2?.message ?? "failed to save linkedin post");

    return { output: [carouselPiece.id, linkedinPiece.id], summary: "saved carousel + LinkedIn drafts" };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: pieceIds[0], finished_at: new Date().toISOString() }).eq("id", input.runId);
  return { briefId: brief.id, pieceIds };
}
