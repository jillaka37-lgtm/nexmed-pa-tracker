"use client";

import { useActionState } from "react";
import { submitStandaloneLinkedin, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function StandaloneLinkedinForm() {
  const [state, formAction, pending] = useActionState(submitStandaloneLinkedin, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Standalone</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">LinkedIn from an observation</h2>
        <p className="mt-1 text-xs text-muted">
          A good post comes from something staff actually saw this week, not a topic. It&apos;s the detail that makes it credible.
        </p>
      </div>
      <div>
        <label htmlFor="observation" className="mb-1.5 block text-sm font-medium text-offwhite">
          This week&apos;s observation (optional)
        </label>
        <textarea
          id="observation"
          name="observation"
          rows={3}
          className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          placeholder="e.g. three patients this week all missed a refill because they didn't realize their insurance required a new prior auth"
        />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Writing…" : "Generate LinkedIn post"}
      </Button>
    </form>
  );
}
