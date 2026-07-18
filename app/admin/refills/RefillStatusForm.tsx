"use client";

import { useActionState } from "react";
import { setRefillStatus, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false };

const STATUSES = ["received", "processing", "ready", "completed", "cancelled"];

export function RefillStatusForm({ id, status }: { id: string; status: string }) {
  const [, action] = useActionState(setRefillStatus, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-[6px] border border-divider bg-navy px-2 py-1 text-xs text-offwhite focus:border-teal focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </form>
  );
}
