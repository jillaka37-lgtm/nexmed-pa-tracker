"use client";

import { useActionState } from "react";
import { submitRepurpose, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function RepurposeForm({ posts }: { posts: { id: string; title: string }[] }) {
  const [state, formAction, pending] = useActionState(submitRepurpose, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-divider bg-card p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Repurpose</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-offwhite">Article → carousel + LinkedIn</h2>
      </div>

      {posts.length === 0 ? (
        <p className="text-xs text-muted">No published articles yet. Publish one in Blog Agents first.</p>
      ) : (
        <>
          <div>
            <label htmlFor="post_id" className="mb-1.5 block text-sm font-medium text-offwhite">Published article</label>
            <select
              id="post_id"
              name="post_id"
              required
              className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite focus:border-teal focus:outline-none"
            >
              {posts.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {state.error && <p className="text-sm text-gold">{state.error}</p>}

          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Writing…" : "Generate carousel + LinkedIn post"}
          </Button>
        </>
      )}
    </form>
  );
}
