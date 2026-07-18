"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createContactAction, type CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function ContactForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createContactAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="full_name" placeholder="Full name" required className={inputClass} />
      <input name="email" type="email" placeholder="Email (optional)" className={inputClass} />
      <input name="phone" placeholder="Phone (optional)" className={inputClass} />
      <select name="company_id" defaultValue="" className={inputClass}>
        <option value="">No company</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="notes" placeholder="Notes (optional)" className={`${inputClass} sm:col-span-2`} />
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
