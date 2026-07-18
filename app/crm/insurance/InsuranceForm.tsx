"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createInsuranceCompanyAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function InsuranceForm() {
  const [state, action, pending] = useActionState(createInsuranceCompanyAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Company name" required className={`${inputClass} sm:col-span-2`} />
      <input name="phone" placeholder="Phone" className={inputClass} />
      <input name="claims_email" type="email" placeholder="Claims email" className={inputClass} />
      <input name="notes" placeholder="Notes" className={`${inputClass} sm:col-span-2`} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add insurance company"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
