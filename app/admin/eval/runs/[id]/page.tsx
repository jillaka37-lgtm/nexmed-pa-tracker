import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RunReport } from "./RunReport";

export const metadata: Metadata = { title: "Eval Run · Staff" };
export const dynamic = "force-dynamic";

export default async function EvalRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: run } = await admin.from("eval_runs").select("*").eq("id", id).maybeSingle();

  if (!run) notFound();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-8 mt-2 font-serif text-3xl font-bold text-offwhite">Run report</h1>
      <RunReport runId={id} initial={run} />
    </div>
  );
}
