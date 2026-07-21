"use client";

import { useActionState } from "react";
import { startBlogRun, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function StartPipelineForm() {
  const [state, formAction, pending] = useActionState(startBlogRun, initial);

  return (
    <form action={formAction} className="rounded-2xl border border-divider bg-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Pipeline</p>
      <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">Generate an article</h2>
      <p className="mt-2 text-sm text-muted">
        idea-scout → strategist → researcher → writer ⇄ editor → seo → publisher → critic. Auto-publishes
        when the editor approves with a score ≥ 75, otherwise saved as a draft for you to review.
      </p>
      <div className="mt-4">
        <label htmlFor="topic_hint" className="mb-1.5 block text-sm font-medium text-offwhite">
          Topic hint (optional)
        </label>
        <input
          id="topic_hint"
          name="topic_hint"
          className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          placeholder="e.g. seasonal allergy medication guide"
        />
      </div>

      {state.error && <p className="mt-3 text-sm text-gold">{state.error}</p>}

      <Button type="submit" className="mt-4" disabled={pending}>
        {pending ? "Starting…" : "Run pipeline"}
      </Button>
    </form>
  );
}
