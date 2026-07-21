import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RunTimeline } from "./RunTimeline";

export const metadata: Metadata = { title: "Content Studio Run · Staff" };
export const dynamic = "force-dynamic";

export default async function ContentStudioRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: run } = await admin.from("content_studio_runs").select("*").eq("id", id).maybeSingle();

  if (!run) notFound();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Content Studio</p>
      <h1 className="mb-8 mt-2 font-serif text-3xl font-bold text-offwhite">
        {run.kind === "carousel" ? "Carousel" : "LinkedIn"} run
      </h1>
      <RunTimeline runId={id} initial={run} />
    </div>
  );
}
