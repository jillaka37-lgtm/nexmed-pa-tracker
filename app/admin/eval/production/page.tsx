import type { Metadata } from "next";
import { getProductionStats } from "@/lib/eval/production";

export const metadata: Metadata = { title: "Production Traffic · Eval" };
export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const stats = await getProductionStats();

  if ("error" in stats) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-3xl font-bold text-offwhite">Production Traffic</h1>
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
          Failed to load production data: {stats.error}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Production Traffic</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        The golden set only tells you how the bot does on questions we thought to ask. This page shows what
        users actually asked, and where the bot came up empty.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Sessions" value={String(stats.totalSessions)} />
        <Stat label="Messages" value={String(stats.totalMessages)} />
        <Stat label="Leads" value={String(stats.totalLeads)} />
        <Stat label="Est. bot cost" value={`$${stats.costUsd.toFixed(3)}`} />
        <Stat label="Satisfaction" value={stats.satisfactionRate != null ? `${Math.round(stats.satisfactionRate * 100)}%` : "no ratings yet"} />
        <Stat label="Lead conversion" value={stats.conversionRate != null ? `${Math.round(stats.conversionRate * 100)}%` : "—"} />
        {stats.byChannel.map((c) => (
          <Stat key={c.channel} label={`Channel: ${c.channel}`} value={String(c.sessions)} />
        ))}
      </div>

      <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Knowledge gaps</h2>
      <p className="mb-3 text-xs text-muted">
        Assistant replies where nothing was retrieved from the knowledge base. Each row below is a real
        question worth adding a document for.
      </p>
      {stats.knowledgeGaps.length === 0 ? (
        <p className="mb-8 rounded-2xl border border-divider bg-card p-6 text-sm text-muted">No gaps recorded.</p>
      ) : (
        <div className="mb-8 overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {stats.knowledgeGaps.map((g) => (
                <tr key={g.messageId} className="border-b border-divider">
                  <td className="px-4 py-3 text-offwhite">{g.question}</td>
                  <td className="px-4 py-3 text-muted">{new Date(g.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Negative feedback (👎)</h2>
      {stats.negativeFeedback.length === 0 ? (
        <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">No negative feedback recorded.</p>
      ) : (
        <div className="space-y-3">
          {stats.negativeFeedback.map((f) => (
            <div key={f.messageId} className="rounded-xl border border-divider bg-card p-4">
              <p className="text-sm text-offwhite">{f.content}</p>
              <p className="mt-2 text-xs text-muted">{new Date(f.createdAt).toLocaleString()}</p>
            </div>
          ))}
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
