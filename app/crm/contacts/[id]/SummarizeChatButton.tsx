"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { summarizeContactChatAction, type CrmState } from "@/app/crm/actions";
import { Button } from "@/components/ui/button";

const initial: CrmState = { ok: false };

export function SummarizeChatButton({ contactId }: { contactId: string }) {
  const [state, formAction, pending] = useActionState(summarizeContactChatAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="contact_id" value={contactId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Summarizing…" : "✨ Summarize chatbot conversation"}
      </Button>
      {state.error && <p className="mt-2 text-xs text-gold">{state.error}</p>}
    </form>
  );
}
