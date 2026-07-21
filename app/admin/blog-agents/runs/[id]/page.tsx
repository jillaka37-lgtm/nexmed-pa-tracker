import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RunTimeline } from "./RunTimeline";

export const metadata: Metadata = { title: "Blog Pipeline Run · Staff" };
export const dynamic = "force-dynamic";

export default async function BlogRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: run } = await admin.from("blog_pipeline_runs").select("*").eq("id", id).maybeSingle();

  if (!run) notFound();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Blog Agents</p>
      <h1 className="mb-8 mt-2 font-serif text-3xl font-bold text-offwhite">Pipeline run</h1>
      <RunTimeline runId={id} initial={run} />
    </div>
  );
}
