"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createDealAction, type CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function DealForm({ contactId, companyId }: { contactId: string; companyId: string | null }) {
  const [state, action, pending] = useActionState(createDealAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="contact_id" value={contactId} />
      {companyId && <input type="hidden" name="company_id" value={companyId} />}
      <input name="title" placeholder="Deal title" required className={`${inputClass} sm:col-span-2`} />
      <input name="amount" type="number" min="0" step="0.01" placeholder="Amount $" className={inputClass} />
      <input name="expected_close" type="date" className={inputClass} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create deal"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
