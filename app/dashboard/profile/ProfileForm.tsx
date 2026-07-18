"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, type DashboardState } from "@/app/dashboard/actions";

const initial: DashboardState = { ok: false };
const inputClass =
  "w-full rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none";

function Feedback({ state }: { state: DashboardState }) {
  if (state.error) return <p className="mt-2 text-sm text-gold">{state.error}</p>;
  if (state.ok && state.message) return <p className="mt-2 text-sm text-health">{state.message}</p>;
  return null;
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-offwhite">Full name</label>
        <input id="full_name" name="full_name" defaultValue={fullName} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-offwhite">Phone</label>
        <input id="phone" name="phone" defaultValue={phone} className={inputClass} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}
