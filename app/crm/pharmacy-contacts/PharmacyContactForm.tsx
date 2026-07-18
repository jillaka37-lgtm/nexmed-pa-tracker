"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createPharmacyContactAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function PharmacyContactForm() {
  const [state, action, pending] = useActionState(createPharmacyContactAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="full_name" placeholder="Full name" required className={inputClass} />
      <input name="role_title" placeholder="Role / title" className={inputClass} />
      <input name="organization" placeholder="Organization" className={inputClass} />
      <input name="phone" placeholder="Phone" className={inputClass} />
      <input name="email" type="email" placeholder="Email" className={`${inputClass} sm:col-span-2`} />
      <input name="notes" placeholder="Notes" className={`${inputClass} sm:col-span-2`} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add contact"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
