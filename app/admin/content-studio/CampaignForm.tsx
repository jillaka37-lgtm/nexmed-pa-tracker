"use client";

import { useActionState } from "react";
import { submitCampaign, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function CampaignForm() {
  const [state, formAction, pending] = useActionState(submitCampaign, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Campaign</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">Multi-channel campaign</h2>
        <p className="mt-1 text-xs text-muted">One theme → a mother narrative → blog + Instagram + LinkedIn + reels, in parallel.</p>
      </div>
      <div>
        <label htmlFor="theme" className="mb-1.5 block text-sm font-medium text-offwhite">Theme</label>
        <input
          id="theme"
          name="theme"
          required
          className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          placeholder="e.g. flu season readiness"
        />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Launch campaign"}
      </Button>
    </form>
  );
}
