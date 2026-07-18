"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { replyToPatient, type StaffMessageState } from "../actions";

const initial: StaffMessageState = { ok: false };

export function ReplyForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(replyToPatient, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        action(formData);
        formRef.current?.reset();
      }}
      className="flex items-end gap-3"
    >
      <input type="hidden" name="user_id" value={userId} />
      <textarea
        name="body"
        placeholder="Reply to this patient…"
        rows={2}
        required
        className="flex-1 rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Reply"}
      </Button>
      {state.error && <p className="text-sm text-gold">{state.error}</p>}
    </form>
  );
}
