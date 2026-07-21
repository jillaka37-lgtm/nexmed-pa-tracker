"use client";

import { useActionState } from "react";
import { submitBrief, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function BriefForm() {
  const [state, formAction, pending] = useActionState(submitBrief, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Weekly brief</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">New LinkedIn post</h2>
      </div>
      <div>
        <label htmlFor="topics" className="mb-1.5 block text-sm font-medium text-offwhite">
          Topics (comma-separated, optional)
        </label>
        <input id="topics" name="topics" className={fieldClass} placeholder="Leave blank and the idea-scout will propose one" />
      </div>
      <div>
        <label htmlFor="campaign" className="mb-1.5 block text-sm font-medium text-offwhite">
          Current campaign (optional)
        </label>
        <input id="campaign" name="campaign" className={fieldClass} placeholder="Fall wellness push" />
      </div>
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-offwhite">
          Notes (optional)
        </label>
        <textarea id="notes" name="notes" rows={3} className={fieldClass} placeholder="Anything the writer should know" />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Writing…" : "Generate post"}
      </Button>
    </form>
  );
}
