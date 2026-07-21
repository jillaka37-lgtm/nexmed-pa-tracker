"use client";

import { useActionState, useState } from "react";
import { decideContentPiece, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function ApprovalCard({ id, hook, body }: { id: string; hook: string | null; body: string }) {
  const [state, formAction, pending] = useActionState(decideContentPiece, initial);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="rounded-2xl border border-divider bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">LinkedIn draft</p>
      {hook && <p className="mt-2 font-semibold text-offwhite">{hook}</p>}

      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={id} />
        {editing ? (
          <textarea
            name="body"
            defaultValue={body}
            rows={8}
            className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite focus:border-teal focus:outline-none"
          />
        ) : (
          <>
            <input type="hidden" name="body" value={body} />
            <p className="whitespace-pre-wrap text-sm text-muted">{body}</p>
          </>
        )}

        {rejecting && (
          <textarea
            name="reject_reason"
            required
            rows={2}
            placeholder="Why is this being rejected?"
            className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          />
        )}

        {state.error && <p className="text-sm text-gold">{state.error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            name="decision"
            value="approved"
            size="sm"
            disabled={pending}
          >
            {pending ? "…" : "Approve"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel edit" : "Edit"}
          </Button>
          {rejecting ? (
            <Button type="submit" name="decision" value="rejected" variant="ghost" size="sm" disabled={pending}>
              Confirm reject
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(true)}>
              Reject
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
