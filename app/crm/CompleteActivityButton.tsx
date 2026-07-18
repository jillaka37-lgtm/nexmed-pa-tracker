"use client";

import { useActionState } from "react";
import { completePatientActivityAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function CompleteActivityButton({ activityId }: { activityId: string }) {
  const [, action, pending] = useActionState(completePatientActivityAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="activity_id" value={activityId} />
      <button type="submit" disabled={pending} className="text-xs text-teal hover:underline disabled:opacity-50">
        {pending ? "…" : "Mark done"}
      </button>
    </form>
  );
}
