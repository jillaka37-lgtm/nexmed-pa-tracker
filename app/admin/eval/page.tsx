import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StartRunForm } from "./StartRunForm";
import goldenSuite from "@/suites/nexmed-chatbot-golden.json";

export const metadata: Metadata = { title: "Eval Dashboard · Staff" };
export const dynamic = "force-dynamic";

export default async function EvalPage() {
  const admin = createAdminClient();
  const { data: runs, error } = await admin
    .from("eval_runs")
    .select("id, status, suite_id, judge_model, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Eval Dashboard</h1>
      <p className="mb-8 text-muted">
        Scores the live chatbot against a golden set of expected behaviors. This is a tool for seeing;
        no prompt changes happen automatically from a run.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <StartRunForm caseCount={goldenSuite.cases.length} />

        <div>
          <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Runs</h2>
          {error ? (
            <p className="text-sm text-gold">Failed to load runs: {error.message}</p>
          ) : !runs || runs.length === 0 ? (
            <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
              No runs yet. Start one to see how the chatbot is doing.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-divider bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Judge model</th>
                    <th className="px-4 py-3 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const summary = r.summary as { overallScore?: number } | null;
                    return (
                      <tr key={r.id} className="border-b border-divider">
                        <td className="px-4 py-3">
                          <Link href={`/admin/eval/runs/${r.id}`} className="text-teal hover:underline">
                            {r.status}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-offwhite tabular-nums">
                          {summary?.overallScore != null ? `${summary.overallScore}/100` : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">{r.judge_model}</td>
                        <td className="px-4 py-3 text-muted">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
