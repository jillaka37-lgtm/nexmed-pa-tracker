"use client";

import { useActionState } from "react";
import { startEvalRun, type EvalState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: EvalState = { ok: false };

export function StartRunForm({ caseCount }: { caseCount: number }) {
  const [state, formAction, pending] = useActionState(startEvalRun, initial);

  return (
    <form action={formAction} className="rounded-2xl border border-divider bg-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Golden set</p>
      <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">{caseCount} cases</h2>
      <p className="mt-2 text-sm text-muted">
        Runs each case against the live chatbot, scores it with a judge model, and reports pass/partial/fail
        per case.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="limit" className="text-sm text-offwhite">Limit (optional)</label>
        <input
          id="limit"
          name="limit"
          type="number"
          min={1}
          max={caseCount}
          placeholder="all"
          className="w-20 rounded-lg border border-divider bg-navy px-3 py-1.5 text-sm text-offwhite focus:border-teal focus:outline-none"
        />
      </div>

      {state.error && <p className="mt-3 text-sm text-gold">{state.error}</p>}

      <Button type="submit" className="mt-4" disabled={pending}>
        {pending ? "Starting…" : "Run evaluation"}
      </Button>
    </form>
  );
}
