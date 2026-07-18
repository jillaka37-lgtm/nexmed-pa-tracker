"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { updatePatientProfileAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";
import type { PatientProfile } from "@/lib/crm/types";

const initial: CrmState = { ok: false };

export function ProfileForm({ userId, profile }: { userId: string; profile: PatientProfile | null }) {
  const [state, action, pending] = useActionState(updatePatientProfileAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="user_id" value={userId} />
      <label className="text-xs text-muted sm:col-span-1">
        Date of birth
        <input name="date_of_birth" type="date" defaultValue={profile?.dateOfBirth ?? ""} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-1">
        Preferred pharmacy
        <input name="preferred_pharmacy" defaultValue={profile?.preferredPharmacy ?? ""} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-1">
        Insurance provider
        <input name="insurance_provider" defaultValue={profile?.insuranceProvider ?? ""} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-1">
        Insurance member ID
        <input name="insurance_member_id" defaultValue={profile?.insuranceMemberId ?? ""} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-2">
        Allergies
        <textarea name="allergies" defaultValue={profile?.allergies ?? ""} rows={2} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-2">
        Conditions
        <textarea name="conditions" defaultValue={profile?.conditions ?? ""} rows={2} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-muted sm:col-span-2">
        Notes
        <textarea name="notes" defaultValue={profile?.notes ?? ""} rows={2} className={`${inputClass} mt-1`} />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
