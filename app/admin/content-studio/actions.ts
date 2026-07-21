"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin, getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runContentBrief, runCarouselBrief, runStandaloneLinkedinBrief, runReelsBrief, runRepurposeBrief } from "@/lib/content-studio/orchestrator";
import { runCampaign } from "@/lib/content-studio/campaign-orchestrator";

export type StudioState = { ok: boolean; error?: string };

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "Not authorized.";
  return null;
}

/**
 * Kicks off a run and redirects immediately — the pipeline itself takes
 * 15-25s (idea-scout, strategist, writer, editor, maybe a revision round),
 * too long for a blocking form submit. after() lets it keep running
 * server-side past the redirect, same pattern already used for
 * judgeResponse() in app/api/chat/route.ts and Blog Agents' pipeline runs.
 */
export async function submitBrief(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const topics = String(formData.get("topics") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const campaign = String(formData.get("campaign") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const user = await getUser();
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("content_studio_runs")
    .insert({ kind: "linkedin", status: "running", topic_hint: topics.join(", ") || null })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runContentBrief({ runId: run.id, topics, campaign, notes, createdBy: user?.id ?? null });
    } catch (err) {
      await admin
        .from("content_studio_runs")
        .update({ status: "error", error: err instanceof Error ? err.message : String(err) })
        .eq("id", run.id);
    }
  });

  redirect(`/admin/content-studio/runs/${run.id}`);
}

/** Runs the standalone Instagram carousel pipeline: idea-scout -> strategist
 * -> writer/editor loop -> save as a draft carousel. Same async-run pattern
 * as submitBrief above. */
export async function submitCarouselBrief(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const topicHint = String(formData.get("topic_hint") ?? "").trim() || null;
  const user = await getUser();
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("content_studio_runs")
    .insert({ kind: "carousel", status: "running", topic_hint: topicHint })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runCarouselBrief({ runId: run.id, topicHint, createdBy: user?.id ?? null });
    } catch (err) {
      await admin
        .from("content_studio_runs")
        .update({ status: "error", error: err instanceof Error ? err.message : String(err) })
        .eq("id", run.id);
    }
  });

  redirect(`/admin/content-studio/runs/${run.id}`);
}

/** Standalone LinkedIn from a staff observation — falls back to idea-scout
 * ideas if left blank, but the output is honestly more generic then. */
export async function submitStandaloneLinkedin(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const observation = String(formData.get("observation") ?? "").trim() || null;
  const user = await getUser();
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("content_studio_runs")
    .insert({ kind: "linkedin", status: "running", topic_hint: observation })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runStandaloneLinkedinBrief({ runId: run.id, observation, createdBy: user?.id ?? null });
    } catch (err) {
      await admin.from("content_studio_runs").update({ status: "error", error: err instanceof Error ? err.message : String(err) }).eq("id", run.id);
    }
  });

  redirect(`/admin/content-studio/runs/${run.id}`);
}

/** Reels script from a link or pasted text. */
export async function submitReels(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const sourceUrl = String(formData.get("source_url") ?? "").trim() || null;
  const sourceText = String(formData.get("source_text") ?? "").trim() || null;
  const leadMagnet = String(formData.get("lead_magnet") ?? "").trim() || null;
  if (!sourceUrl && !sourceText) return { ok: false, error: "Provide either a link or text." };

  const user = await getUser();
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("content_studio_runs")
    .insert({ kind: "reels", status: "running", topic_hint: sourceUrl ?? sourceText?.slice(0, 100) })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runReelsBrief({ runId: run.id, sourceUrl, sourceText, leadMagnet, createdBy: user?.id ?? null });
    } catch (err) {
      await admin.from("content_studio_runs").update({ status: "error", error: err instanceof Error ? err.message : String(err) }).eq("id", run.id);
    }
  });

  redirect(`/admin/content-studio/runs/${run.id}`);
}

/** Repurpose a published blog post into a carousel + LinkedIn post. */
export async function submitRepurpose(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { ok: false, error: "Pick a published article." };

  const user = await getUser();
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("content_studio_runs")
    .insert({ kind: "carousel", status: "running", topic_hint: `repurpose:${postId}` })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runRepurposeBrief({ runId: run.id, postId, createdBy: user?.id ?? null });
    } catch (err) {
      await admin.from("content_studio_runs").update({ status: "error", error: err instanceof Error ? err.message : String(err) }).eq("id", run.id);
    }
  });

  redirect(`/admin/content-studio/runs/${run.id}`);
}

/** Multi-channel campaign: one theme -> mother narrative -> 4 channels in
 * parallel, each owning its own run row. The campaign row is created
 * synchronously (fast) so the redirect is immediate; the slow part
 * (narrative + four pipelines, ~30-60s) runs via after(), same pattern as
 * every other pipeline here. */
export async function submitCampaign(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const theme = String(formData.get("theme") ?? "").trim();
  if (!theme) return { ok: false, error: "A theme is required." };

  const user = await getUser();
  const admin = createAdminClient();

  const { data: campaign, error } = await admin.from("content_campaigns").insert({ theme, created_by: user?.id ?? null }).select("id").single();
  if (error || !campaign) return { ok: false, error: error?.message ?? "Failed to start campaign." };

  after(async () => {
    try {
      await runCampaign({ campaignId: campaign.id, theme, createdBy: user?.id ?? null });
    } catch (err) {
      await admin.from("content_campaigns").update({ narrative: { error: err instanceof Error ? err.message : String(err) } }).eq("id", campaign.id);
    }
  });

  redirect(`/admin/content-studio/campaigns/${campaign.id}`);
}

export async function decideContentPiece(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const rejectReason = String(formData.get("reject_reason") ?? "").trim() || null;
  const editedBody = String(formData.get("body") ?? "").trim();

  if (!id || (decision !== "approved" && decision !== "rejected")) {
    return { ok: false, error: "Invalid decision." };
  }
  if (decision === "rejected" && !rejectReason) {
    return { ok: false, error: "A reason is required to reject." };
  }

  const user = await getUser();
  const admin = createAdminClient();
  const { error } = await admin
    .from("content_pieces")
    .update({
      status: decision,
      reject_reason: decision === "rejected" ? rejectReason : null,
      body: editedBody || undefined,
      decided_at: new Date().toISOString(),
      decided_by: user?.id ?? null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/content-studio");
  return { ok: true };
}

export async function updateBrandVoice(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const id = String(formData.get("id") ?? "");
  const tone = String(formData.get("tone") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const bannedWords = String(formData.get("banned_words") ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  if (!id || !tone || !audience) return { ok: false, error: "Tone and audience are required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("brand_voice")
    .update({ tone, audience, banned_words: bannedWords, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/content-studio");
  return { ok: true };
}
