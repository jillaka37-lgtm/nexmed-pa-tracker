"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback } from "@/components/crm/ui";
import { createActivityAction, type CrmState } from "@/app/crm/actions";

const initial: CrmState = { ok: false };

export function ActivityForm({ contactId }: { contactId: string }) {
  const [state, action, pending] = useActionState(createActivityAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="contact_id" value={contactId} />
      <select name="type" defaultValue="note" className={inputClass}>
        <option value="note">Note</option>
        <option value="call">Call</option>
        <option value="meeting">Meeting</option>
        <option value="task">Task</option>
      </select>
      <input type="hidden" name="due_at" id="due_at_iso" />
      <input
        type="datetime-local"
        className={inputClass}
        onChange={(e) => {
          const iso = e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : "";
          const hidden = document.getElementById("due_at_iso") as HTMLInputElement | null;
          if (hidden) hidden.value = iso;
        }}
      />
      <input name="title" placeholder="Title" required className={`${inputClass} sm:col-span-2`} />
      <textarea name="body" placeholder="Details (optional)" rows={2} className={`${inputClass} sm:col-span-2`} />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add to timeline"}
        </Button>
        <div className="mt-2">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
