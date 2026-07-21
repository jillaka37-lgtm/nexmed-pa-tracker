import type { Metadata } from "next";
import { getAllHumanLabels, computeAlignment } from "@/lib/eval/alignment";

export const metadata: Metadata = { title: "Judge of Judge · Eval" };
export const dynamic = "force-dynamic";

const VERDICTS = ["pass", "partial", "fail"] as const;

function kappaVerdict(k: number): { label: string; color: string } {
  if (k < 0.4) return { label: "poor, don't trust the judge yet", color: "text-red-400" };
  if (k < 0.6) return { label: "moderate", color: "text-gold" };
  if (k < 0.8) return { label: "good", color: "text-teal" };
  return { label: "excellent", color: "text-health" };
}

export default async function JudgeOfJudgePage() {
  const labels = await getAllHumanLabels();
  const alignment = computeAlignment(labels);
  const kv = kappaVerdict(alignment.cohensKappa);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Judge of Judge</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        We&apos;re using one model to score another model&apos;s answers. Agreement rate alone is misleading:
        a judge that always says &quot;pass&quot; looks great if most cases really do pass, without
        understanding anything. Cohen&apos;s kappa corrects for chance agreement. Label at least 20-30 cases
        (via the &quot;Your verdict?&quot; box on a run report) before trusting this number.
      </p>

      {alignment.total === 0 ? (
        <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
          No human labels yet. Open a run report and record your own verdict on a few cases to start
          measuring judge accuracy.
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Labeled cases" value={String(alignment.total)} />
            <Stat label="Agreement rate" value={`${Math.round(alignment.agreementRate * 100)}%`} />
            <div className="rounded-xl border border-divider bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Cohen&apos;s kappa</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${kv.color}`}>{alignment.cohensKappa} · {kv.label}</p>
            </div>
          </div>

          <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Confusion matrix</h2>
          <p className="mb-3 text-xs text-muted">Rows = your verdict, columns = judge&apos;s verdict.</p>
          <div className="overflow-hidden rounded-2xl border border-divider bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Human \ Judge</th>
                  {VERDICTS.map((v) => (
                    <th key={v} className="px-4 py-3 font-medium">{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VERDICTS.map((h) => (
                  <tr key={h} className="border-b border-divider">
                    <td className="px-4 py-3 font-medium text-offwhite">{h}</td>
                    {VERDICTS.map((j) => (
                      <td key={j} className={`px-4 py-3 tabular-nums ${h === j ? "text-health" : "text-muted"}`}>
                        {alignment.matrix[h][j]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
