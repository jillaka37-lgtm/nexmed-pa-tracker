import type { Metadata } from "next";
import goldenSuite from "@/suites/nexmed-chatbot-golden.json";

export const metadata: Metadata = { title: "Golden Set · Eval" };

export default function SuitesPage() {
  const categories = [...new Set(goldenSuite.cases.map((c) => c.category))];

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Golden Set</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        {goldenSuite.cases.length} cases across {categories.length} categories, kept in{" "}
        <code className="rounded bg-navy px-1.5 py-0.5 text-xs">suites/nexmed-chatbot-golden.json</code> in
        git, not the database, because it&apos;s an engineering artifact that should go through code review,
        not user data.
      </p>

      <div className="space-y-4">
        {goldenSuite.cases.map((c) => (
          <div key={c.id} className="rounded-2xl border border-divider bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">{c.id} · {c.category}</p>
              <span className="text-xs text-muted">weight {c.weight}{c.groundedExpected ? " · grounded" : ""}</span>
            </div>
            {c.turns ? (
              <div className="mt-2 space-y-1">
                {c.turns.map((t, i) => (
                  <p key={i} className="text-sm text-offwhite">
                    <span className="text-xs text-muted">turn {i + 1}:</span> {t.user}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-offwhite">{c.message}</p>
            )}
            <p className="mt-2 text-xs text-muted"><span className="font-medium">Expected:</span> {c.expected}</p>
            <p className="mt-1 text-xs text-muted"><span className="font-medium">Failure signal:</span> {c.failureSignal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
