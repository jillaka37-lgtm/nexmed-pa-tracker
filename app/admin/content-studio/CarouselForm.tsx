"use client";

import { useActionState } from "react";
import { submitCarouselBrief, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function CarouselForm() {
  const [state, formAction, pending] = useActionState(submitCarouselBrief, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Standalone</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">New Instagram carousel</h2>
        <p className="mt-1 text-xs text-muted">idea-scout → strategist → writer ⇄ editor. Leave blank for a fully AI-picked topic.</p>
      </div>
      <div>
        <label htmlFor="topic_hint" className="mb-1.5 block text-sm font-medium text-offwhite">
          Topic hint (optional)
        </label>
        <input
          id="topic_hint"
          name="topic_hint"
          className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          placeholder="e.g. common refill mistakes"
        />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Writing…" : "Generate carousel"}
      </Button>
    </form>
  );
}
