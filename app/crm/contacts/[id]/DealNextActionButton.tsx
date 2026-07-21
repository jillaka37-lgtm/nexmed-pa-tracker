"use client";

import { useActionState } from "react";
import { suggestDealNextActionAction, type CrmState } from "@/app/crm/actions";
import { Button } from "@/components/ui/button";

const initial: CrmState = { ok: false };

export function DealNextActionButton({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(suggestDealNextActionAction, initial);

  return (
    <form action={formAction} className="mt-1">
      <input type="hidden" name="deal_id" value={dealId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Thinking…" : "✨ Next action?"}
      </Button>
      {state.message && <p className="mt-1 max-w-sm text-xs text-teal">{state.message}</p>}
      {state.error && <p className="mt-1 text-xs text-gold">{state.error}</p>}
    </form>
  );
}
