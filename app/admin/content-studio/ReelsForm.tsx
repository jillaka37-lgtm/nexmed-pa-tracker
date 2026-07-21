"use client";

import { useActionState, useState } from "react";
import { submitReels, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };
const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none";

export function ReelsForm() {
  const [state, formAction, pending] = useActionState(submitReels, initial);
  const [mode, setMode] = useState<"url" | "text">("url");

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Standalone</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">Reels script</h2>
      </div>

      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setMode("url")} className={`rounded-full px-3 py-1 ${mode === "url" ? "bg-teal/10 text-teal" : "text-muted"}`}>
          From a link
        </button>
        <button type="button" onClick={() => setMode("text")} className={`rounded-full px-3 py-1 ${mode === "text" ? "bg-teal/10 text-teal" : "text-muted"}`}>
          From text
        </button>
      </div>

      {mode === "url" ? (
        <div>
          <label htmlFor="source_url" className="mb-1.5 block text-sm font-medium text-offwhite">Link</label>
          <input id="source_url" name="source_url" type="url" className={fieldClass} placeholder="https://..." />
        </div>
      ) : (
        <div>
          <label htmlFor="source_text" className="mb-1.5 block text-sm font-medium text-offwhite">Text</label>
          <textarea id="source_text" name="source_text" rows={4} className={fieldClass} placeholder="Paste the idea or article text" />
        </div>
      )}

      <div>
        <label htmlFor="lead_magnet" className="mb-1.5 block text-sm font-medium text-offwhite">Free resource (optional)</label>
        <input id="lead_magnet" name="lead_magnet" className={fieldClass} placeholder="e.g. our medication refill checklist" />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Writing…" : "Generate script"}
      </Button>
    </form>
  );
}
