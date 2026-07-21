"use client";

import { useActionState } from "react";
import { updateBrandVoice, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function BrandVoiceForm({
  id,
  tone,
  audience,
  bannedWords,
}: {
  id: string;
  tone: string;
  audience: string;
  bannedWords: string[];
}) {
  const [state, formAction, pending] = useActionState(updateBrandVoice, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <input type="hidden" name="id" value={id} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Brand voice</p>
        <p className="mt-1 text-xs text-muted">Read by every content agent before it writes anything.</p>
      </div>
      <div>
        <label htmlFor="tone" className="mb-1.5 block text-sm font-medium text-offwhite">Tone</label>
        <textarea id="tone" name="tone" defaultValue={tone} rows={2} required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="audience" className="mb-1.5 block text-sm font-medium text-offwhite">Audience</label>
        <input id="audience" name="audience" defaultValue={audience} required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="banned_words" className="mb-1.5 block text-sm font-medium text-offwhite">
          Banned words (comma-separated)
        </label>
        <input id="banned_words" name="banned_words" defaultValue={bannedWords.join(", ")} className={fieldClass} />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}
      {state.ok && <p className="text-sm text-health">Saved.</p>}

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save brand voice"}
      </Button>
    </form>
  );
}
