import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ChannelResult = {
  status: "running" | "done" | "error" | "pending";
  error: string | null;
  steps: { agent: string; label: string; status: string; summary?: string }[];
  output: Record<string, unknown> | null;
};

/**
 * Resolves the campaign row PLUS each channel's actual output — not just
 * its step timeline. A campaign panel that only shows a green checkmark
 * per channel without letting you see what it actually wrote isn't useful;
 * this was explicitly called out as a thing that got missed once already.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: campaign, error } = await admin.from("content_campaigns").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const runIds = (campaign.run_ids ?? {}) as { blog?: string; instagram?: string; linkedin?: string; reels?: string };

  async function resolveContentStudioChannel(runId: string | undefined): Promise<ChannelResult> {
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

  async function resolveBlogChannel(runId: string | undefined): Promise<ChannelResult> {
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

  return NextResponse.json(
    { id: campaign.id, theme: campaign.theme, narrative: campaign.narrative, channels: { blog, instagram, linkedin, reels } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
