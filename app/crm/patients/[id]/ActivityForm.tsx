"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createPatientActivityAction } from "@/app/crm/careActions";
import type { CrmState } from "@/app/crm/actions";
import type { PatientActivityType } from "@/lib/crm/types";

const initial: CrmState = { ok: false };

export function ActivityForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(createPatientActivityAction, initial);
  const [type, setType] = useState<PatientActivityType>("note");

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as PatientActivityType)}
        className={inputClass}
      >
        <option value="note">Note</option>
        <option value="task">Task</option>
        <option value="reminder">Reminder</option>
      </select>

      {type === "task" && (
        <input
          type="datetime-local"
          className={inputClass}
          onChange={(e) => {
            const iso = e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : "";
            const hidden = document.getElementById(`due_at_${userId}`) as HTMLInputElement | null;
            if (hidden) hidden.value = iso;
          }}
        />
      )}
      {type === "reminder" && (
        <input
          type="datetime-local"
          className={inputClass}
          onChange={(e) => {
            const iso = e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : "";
            const hidden = document.getElementById(`remind_at_${userId}`) as HTMLInputElement | null;
            if (hidden) hidden.value = iso;
          }}
        />
      )}
      {type === "note" && <div />}

      <input type="hidden" name="due_at" id={`due_at_${userId}`} />
      <input type="hidden" name="remind_at" id={`remind_at_${userId}`} />

      <input name="title" placeholder="Title" required className={`${inputClass} sm:col-span-2`} />
      <textarea name="body" placeholder="Details (optional)" rows={2} className={`${inputClass} sm:col-span-2`} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
