"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createCompanyAction, type CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Company name" required className={inputClass} />
      <input name="industry" placeholder="Industry (optional)" className={inputClass} />
      <input name="phone" placeholder="Phone (optional)" className={inputClass} />
      <input name="notes" placeholder="Notes (optional)" className={inputClass} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add company"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
