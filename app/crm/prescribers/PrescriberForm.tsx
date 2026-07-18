"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createPrescriberAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function PrescriberForm() {
  const [state, action, pending] = useActionState(createPrescriberAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="full_name" placeholder="Full name" required className={inputClass} />
      <input name="specialty" placeholder="Specialty (optional)" className={inputClass} />
      <input name="clinic_name" placeholder="Clinic / practice name" className={inputClass} />
      <input name="phone" placeholder="Phone" className={inputClass} />
      <input name="email" type="email" placeholder="Email" className={inputClass} />
      <input name="fax" placeholder="Fax" className={inputClass} />
      <input name="notes" placeholder="Notes" className={`${inputClass} sm:col-span-2`} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add prescriber"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
