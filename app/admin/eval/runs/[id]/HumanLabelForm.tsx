"use client";

import { useActionState } from "react";
import { submitHumanLabel, type EvalState } from "../../actions";
import { Button } from "@/components/ui/button";

const initial: EvalState = { ok: false };

export function HumanLabelForm({ runId, caseId, judgeVerdict }: { runId: string; caseId: string; judgeVerdict: string }) {
  const [state, formAction, pending] = useActionState(submitHumanLabel, initial);

  return (
    <form action={formAction} className="rounded-xl border border-divider bg-navy p-3">
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="judge_verdict" value={judgeVerdict} />
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">Your verdict?</p>
      <p className="mt-1 text-xs text-muted">Feeds the Judge of Judge page: do you agree with the judge?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(["pass", "partial", "fail"] as const).map((v) => (
          <Button key={v} type="submit" name="human_verdict" value={v} size="sm" variant="outline" disabled={pending}>
            {v}
          </Button>
        ))}
      </div>
      <textarea
        name="note"
        rows={1}
        placeholder="Optional note"
        className="mt-2 w-full rounded-lg border border-divider bg-card px-3 py-2 text-xs text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
      />
      {state.ok && <p className="mt-1 text-xs text-health">Saved.</p>}
      {state.error && <p className="mt-1 text-xs text-gold">{state.error}</p>}
    </form>
  );
}
