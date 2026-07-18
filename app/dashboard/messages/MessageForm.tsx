"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { sendMessage, type DashboardState } from "@/app/dashboard/actions";

const initial: DashboardState = { ok: false };

export function MessageForm() {
  const [state, action, pending] = useActionState(sendMessage, initial);
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
      <textarea
        name="body"
        placeholder="Write a message to our pharmacy team…"
        rows={2}
        required
        className="flex-1 rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
      {state.error && <p className="text-sm text-gold">{state.error}</p>}
    </form>
  );
}
