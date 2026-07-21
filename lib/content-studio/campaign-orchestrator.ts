import { createAdminClient } from "@/lib/supabase/admin";
import { logAiCall } from "@/lib/audit";
import { buildCampaignNarrative } from "./agents/campaign-strategist";
import { buildBriefFromAngle } from "./agents/brief-from-angle";
import { findLinkedinAngle } from "./agents/linkedin-angle-finder";
import { writeCarousel, reviseCarousel } from "./agents/carousel-writer";
import { writeSocialLinkedinPost, reviseSocialLinkedinPost } from "./agents/social-linkedin-writer";
import { writeReelsScript, reviseReelsScript } from "./agents/reels-writer";
import { prepareReelsSource } from "./reels-source";
import { availableCtas } from "./reels-cta";
import { runInstagramChecks, runLinkedinChecks, runReelsChecks } from "./social-checks";
import { runSocialEditor } from "./social-editor";
import { writeAndReview } from "./social-loop";
import { makeStepRunner } from "./run-steps";
import { brandVoiceFromRow, type BrandVoice, type CampaignNarrative } from "./types";
import { runBlogPipeline } from "@/lib/blog-agents/orchestrator";

async function getBrandVoice(admin: ReturnType<typeof createAdminClient>): Promise<BrandVoice> {
  const { data, error } = await admin.from("brand_voice").select("*").limit(1).single();
  if (error || !data) throw new Error("brand_voice is not configured");
  return brandVoiceFromRow(data);
}

/**
 * Why parallel is safe here but wasn't for repurpose: in repurpose,
 * Instagram and LinkedIn wrote to one shared run's steps array —
 * parallelizing them would have interleaved and dropped steps. Here, each
 * channel gets its own run row (blog gets its own blog_pipeline_runs row,
 * the other three each get their own content_studio_runs row), so there's
 * no shared state. The difference is data ownership, not preference.
 * Promise.allSettled, not all — one channel failing must not kill the rest.
 */
/**
 * Takes an already-created campaign row's id — the row itself is created
 * synchronously by the caller (server action) so it can redirect to the
 * campaign page immediately; this function does the slow part (narrative +
 * four parallel pipelines, ~30-60s) and is meant to be invoked via after().
 */
export async function runCampaign(input: { campaignId: string; theme: string; createdBy: string | null }): Promise<void> {
  const admin = createAdminClient();
  const brand = await getBrandVoice(admin);
  const campaign = { id: input.campaignId };

  let narrative: CampaignNarrative;
  try {
    const { data: existingPosts } = await admin.from("blog_posts").select("title").limit(30);
    const { data: existingPieces } = await admin.from("content_pieces").select("hook").not("hook", "is", null).limit(30);
    const existingTitles = [...(existingPosts ?? []).map((p) => p.title), ...(existingPieces ?? []).map((p) => p.hook as string)];

    narrative = await buildCampaignNarrative({ brand, theme: input.theme, existingTitles });
  } catch (err) {
    await admin.from("content_campaigns").update({ narrative: { error: err instanceof Error ? err.message : String(err) } }).eq("id", campaign.id);
    throw err;
  }

  await admin.from("content_campaigns").update({ narrative }).eq("id", campaign.id);
  await logAiCall({ userId: input.createdBy, feature: "content-studio:campaign-strategist", prompt: input.theme, response: narrative });

  // Create one run row per channel BEFORE starting anything, so run_ids is
  // populated even if a channel fails immediately.
  const [{ data: blogRun }, { data: igRun }, { data: liRun }, { data: reelsRun }] = await Promise.all([
    admin.from("blog_pipeline_runs").insert({ status: "running", topic_hint: narrative.blogAngle }).select("id").single(),
    admin.from("content_studio_runs").insert({ kind: "carousel", status: "running", topic_hint: narrative.instagramAngle }).select("id").single(),
    admin.from("content_studio_runs").insert({ kind: "linkedin", status: "running", topic_hint: narrative.linkedinAngle }).select("id").single(),
    admin.from("content_studio_runs").insert({ kind: "reels", status: "running", topic_hint: narrative.reelsAngle }).select("id").single(),
  ]);

  const runIds = { blog: blogRun?.id ?? null, instagram: igRun?.id ?? null, linkedin: liRun?.id ?? null, reels: reelsRun?.id ?? null };
  await admin.from("content_campaigns").update({ run_ids: runIds }).eq("id", campaign.id);

  const results = await Promise.allSettled([
    blogRun ? runBlogPipeline({ runId: blogRun.id, topicHint: narrative.blogAngle }) : Promise.reject(new Error("no blog run row")),
    igRun ? runCampaignInstagramChannel({ admin, brand, runId: igRun.id, angle: narrative.instagramAngle, createdBy: input.createdBy }) : Promise.reject(new Error("no ig run row")),
    liRun ? runCampaignLinkedinChannel({ admin, brand, runId: liRun.id, angle: narrative.linkedinAngle, createdBy: input.createdBy }) : Promise.reject(new Error("no li run row")),
    reelsRun ? runCampaignReelsChannel({ admin, brand, runId: reelsRun.id, angle: narrative.reelsAngle, createdBy: input.createdBy }) : Promise.reject(new Error("no reels run row")),
  ]);

  // Mark any channel that threw as errored on its own run row — a failed
  // channel must not be silently invisible.
  const [blogResult, igResult, liResult, reelsResult] = results;
  if (blogResult.status === "rejected" && blogRun) {
    await admin.from("blog_pipeline_runs").update({ status: "error", error: String(blogResult.reason) }).eq("id", blogRun.id);
  }
  if (igResult.status === "rejected" && igRun) {
    await admin.from("content_studio_runs").update({ status: "error", error: String(igResult.reason) }).eq("id", igRun.id);
  }
  if (liResult.status === "rejected" && liRun) {
    await admin.from("content_studio_runs").update({ status: "error", error: String(liResult.reason) }).eq("id", liRun.id);
  }
  if (reelsResult.status === "rejected" && reelsRun) {
    await admin.from("content_studio_runs").update({ status: "error", error: String(reelsResult.reason) }).eq("id", reelsRun.id);
  }
}

async function runCampaignInstagramChannel(opts: {
  admin: ReturnType<typeof createAdminClient>;
  brand: BrandVoice;
  runId: string;
  angle: string;
  createdBy: string | null;
}): Promise<void> {
  const { admin, brand } = opts;
  const { step } = makeStepRunner(opts.runId);

  const socialBrief = await step("carousel-strategist", "Content Strategist", async () => {
    const out = await buildBriefFromAngle({ brand, angle: opts.angle, trusted: false });
    return { output: out, summary: out.coreMessage.slice(0, 100) };
  });

  const { data: brief } = await admin.from("content_briefs").insert({ topics: [opts.angle.slice(0, 80)], campaign: "campaign", notes: null, created_by: opts.createdBy }).select("id").single();
  if (!brief) throw new Error("failed to save brief");

  const result = await writeAndReview({
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

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({ brief_id: brief.id, platform: "carousel", hook: result.draft.title, body: result.draft.caption, slides: result.draft.slides, hashtags: result.draft.hashtags, extras: { cta: result.draft.cta }, score: result.review.score, status: "draft" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${result.review.score}/100` };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() }).eq("id", opts.runId);
}

async function runCampaignLinkedinChannel(opts: {
  admin: ReturnType<typeof createAdminClient>;
  brand: BrandVoice;
  runId: string;
  angle: string;
  createdBy: string | null;
}): Promise<void> {
  const { admin, brand } = opts;
  const { step } = makeStepRunner(opts.runId);

  const socialBrief = await step("linkedin-angle-finder", "Angle Finder", async () => {
    const out = await findLinkedinAngle({ brand, observation: opts.angle, observationIsTrusted: false, ideas: [] });
    return { output: out, summary: out.coreMessage.slice(0, 100) };
  });

  const { data: brief } = await admin.from("content_briefs").insert({ topics: [opts.angle.slice(0, 80)], campaign: "campaign", notes: null, created_by: opts.createdBy }).select("id").single();
  if (!brief) throw new Error("failed to save brief");

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

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({ brief_id: brief.id, platform: "linkedin", hook: result.draft.title, body: `${result.draft.body}\n\n${result.draft.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`, score: result.review.score, status: "draft" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${result.review.score}/100` };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() }).eq("id", opts.runId);
}

async function runCampaignReelsChannel(opts: {
  admin: ReturnType<typeof createAdminClient>;
  brand: BrandVoice;
  runId: string;
  angle: string;
  createdBy: string | null;
}): Promise<void> {
  const { admin, brand } = opts;
  const { step } = makeStepRunner(opts.runId);

  const source = await step("reels-source", "Source Prep", async () => {
    const out = await prepareReelsSource({ sourceText: opts.angle, trusted: false });
    return { output: out, summary: `${out.text.length} chars, campaign-generated angle` };
  });

  const { data: brief } = await admin.from("content_briefs").insert({ topics: [opts.angle.slice(0, 80)], campaign: "campaign", notes: null, created_by: opts.createdBy }).select("id").single();
  if (!brief) throw new Error("failed to save brief");

  let draft = await step("reels-writer", "Reels Copywriter — first draft", async () => {
    const out = await writeReelsScript({ brand, source, leadMagnet: null });
    return { output: out, summary: `"${out.title}"` };
  });

  const allowedCtaIds = availableCtas(false).map((c) => c.id);
  let checks = runReelsChecks({ ...draft, allowedCtaIds });
  const briefStandIn = () => ({ coreMessage: draft.hook, audience: brand.audience, keyPoints: [draft.body.slice(0, 200)], hookAngle: draft.hook, proofPoint: draft.body.slice(0, 200), cta: draft.cta });

  let review = await step("social-editor", "Social Editor — Reels", async () => {
    const out = await runSocialEditor({ brand, channel: "reels", brief: briefStandIn(), draft, failedChecks: checks.filter((c) => !c.pass) });
    return { output: out, summary: `score ${out.score}/100` };
  });

  if (review.verdict === "revise" || checks.some((c) => !c.pass)) {
    const failed = checks.filter((c) => !c.pass);
    const previousReview = review;
    draft = await step("reels-writer", "Reels Copywriter — revision", async () => {
      const out = await reviseReelsScript({ brand, source, leadMagnet: null, draft, review: previousReview, failedChecks: failed });
      return { output: out, summary: `revised based on ${previousReview.issues.length} issue(s)` };
    });
    checks = runReelsChecks({ ...draft, allowedCtaIds });
    review = await step("social-editor", "Social Editor — re-review Reels", async () => {
      const out = await runSocialEditor({ brand, channel: "reels", brief: briefStandIn(), draft, failedChecks: checks.filter((c) => !c.pass) });
      return { output: out, summary: `score ${out.score}/100` };
    });
  }

  const piece = await step("publisher", "Publisher", async () => {
    const { data, error } = await admin
      .from("content_pieces")
      .insert({ brief_id: brief.id, platform: "reels", hook: draft.title, body: `${draft.hook}\n\n${draft.body}\n\n${draft.cta}`, hashtags: draft.hashtags, extras: { onScreenText: draft.onScreenText, caption: draft.caption, ctaId: draft.ctaId, ctaReason: draft.ctaReason, sourceOrigin: "campaign angle" }, score: review.score, status: "draft" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "failed to save draft");
    return { output: data, summary: `saved as draft, score ${review.score}/100` };
  });

  await admin.from("content_studio_runs").update({ status: "done", piece_id: piece.id, finished_at: new Date().toISOString() }).eq("id", opts.runId);
}
