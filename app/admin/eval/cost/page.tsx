import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductionStats } from "@/lib/eval/production";

export const metadata: Metadata = { title: "Cost & Latency · Eval" };
export const dynamic = "force-dynamic";

export default async function CostPage() {
  const admin = createAdminClient();
  const [{ data: runs, error }, production] = await Promise.all([
    admin.from("eval_runs").select("id, label, judge_model, summary, created_at").eq("status", "done").order("created_at", { ascending: false }).limit(20),
    getProductionStats(),
  ]);

  const productionCost = "error" in production ? null : production.costUsd;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Cost &amp; Latency</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Running the bot and judging it are two different costs. This page keeps them separate on purpose,
        since only one of them scales with your actual users.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Est. bot cost (production, all-time)" value={productionCost != null ? `$${productionCost.toFixed(3)}` : "—"} />
        <Stat label="Judge cost (last 20 runs)" value={`$${(runs ?? []).reduce((s, r) => s + ((r.summary as { judgeCostUsd?: number } | null)?.judgeCostUsd ?? 0), 0).toFixed(3)}`} />
        <Stat label="Judge tokens (last 20 runs)" value={String((runs ?? []).reduce((s, r) => s + ((r.summary as { judgeTokens?: number } | null)?.judgeTokens ?? 0), 0))} />
      </div>

      <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Per-run breakdown</h2>
      {error ? (
        <p className="text-sm text-gold">Failed to load runs: {error.message}</p>
      ) : !runs || runs.length === 0 ? (
        <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">No completed runs yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Judge model</th>
                <th className="px-4 py-3 font-medium">Judge cost</th>
                <th className="px-4 py-3 font-medium">Avg latency</th>
                <th className="px-4 py-3 font-medium">p95 latency</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const s = r.summary as { judgeCostUsd?: number; latency?: { avgMs?: number; p95Ms?: number } } | null;
                return (
                  <tr key={r.id} className="border-b border-divider">
                    <td className="px-4 py-3 text-offwhite">{r.label ?? new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted">{r.judge_model}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">${(s?.judgeCostUsd ?? 0).toFixed(4)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{s?.latency?.avgMs ?? "—"}ms</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{s?.latency?.p95Ms ?? "—"}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-offwhite">{value}</p>
    </div>
  );
}
