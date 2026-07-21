import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CampaignPanel } from "./CampaignPanel";

export const metadata: Metadata = { title: "Campaign · Content Studio" };
export const dynamic = "force-dynamic";

type Channel = {
  status: "running" | "done" | "error" | "pending";
  error: string | null;
  steps: { agent: string; label: string; status: string; summary?: string }[];
  output: Record<string, unknown> | null;
};

/** Same resolution logic as /api/content-studio/campaigns/[id] — this page
 * does the initial server-rendered load, the API route serves the client's
 * subsequent polls. Kept in sync by hand since it's a small amount of logic
 * duplicated deliberately to avoid a fragile self-fetch from a Server
 * Component. */
async function resolveCampaign(id: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin.from("content_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign) return null;

  const runIds = (campaign.run_ids ?? {}) as { blog?: string; instagram?: string; linkedin?: string; reels?: string };

  async function resolveContentStudioChannel(runId: string | undefined): Promise<Channel> {
    if (!runId) return { status: "pending", error: null, steps: [], output: null };
    const { data: run } = await admin.from("content_studio_runs").select("*").eq("id", runId).maybeSingle();
    if (!run) return { status: "pending", error: null, steps: [], output: null };
    let output: Record<string, unknown> | null = null;
    if (run.piece_id) {
      const { data: piece } = await admin.from("content_pieces").select("*").eq("id", run.piece_id).maybeSingle();
      output = piece;
    }
    return { status: run.status, error: run.error, steps: run.steps ?? [], output };
  }

  async function resolveBlogChannel(runId: string | undefined): Promise<Channel> {
    if (!runId) return { status: "pending", error: null, steps: [], output: null };
    const { data: run } = await admin.from("blog_pipeline_runs").select("*").eq("id", runId).maybeSingle();
    if (!run) return { status: "pending", error: null, steps: [], output: null };
    let output: Record<string, unknown> | null = null;
    if (run.post_id) {
      const { data: post } = await admin.from("blog_posts").select("title, slug, excerpt, status, score").eq("id", run.post_id).maybeSingle();
      output = post;
    }
    return { status: run.status, error: run.error, steps: run.steps ?? [], output };
  }

  const [blog, instagram, linkedin, reels] = await Promise.all([
    resolveBlogChannel(runIds.blog),
    resolveContentStudioChannel(runIds.instagram),
    resolveContentStudioChannel(runIds.linkedin),
    resolveContentStudioChannel(runIds.reels),
  ]);

  return { id: campaign.id, theme: campaign.theme, narrative: campaign.narrative, channels: { blog, instagram, linkedin, reels } };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await resolveCampaign(id);
  if (!data) notFound();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Content Studio</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Campaign: {data.theme}</h1>
      <p className="mb-8 text-muted">Four channels, one narrative. Each card shows the real output, not just a progress bar.</p>
      <CampaignPanel campaignId={id} initial={data} />
    </div>
  );
}
