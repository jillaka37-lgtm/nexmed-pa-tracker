import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBlogPipeline } from "@/lib/blog-agents/orchestrator";

/**
 * Fail-closed on purpose: if CRON_SECRET isn't set, reject outright rather
 * than falling back to an always-mismatching comparison. A single GET here
 * triggers a full pipeline run (10-15 model calls) — leaving it reachable
 * without a real secret configured means anyone who finds the URL can spend
 * the OpenRouter budget.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: run, error } = await admin
    .from("blog_pipeline_runs")
    .insert({ status: "running", topic_hint: null })
    .select("id")
    .single();
  if (error || !run) return NextResponse.json({ error: error?.message ?? "failed to start run" }, { status: 500 });

  try {
    await runBlogPipeline({ runId: run.id, topicHint: null });
    return NextResponse.json({ runId: run.id, status: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("blog_pipeline_runs").update({ status: "error", error: message }).eq("id", run.id);
    return NextResponse.json({ runId: run.id, error: message }, { status: 500 });
  }
}
