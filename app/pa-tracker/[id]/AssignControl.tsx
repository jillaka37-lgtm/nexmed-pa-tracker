"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffOption } from "@/lib/pa-tracker/staff";

export function AssignControl({
  caseId,
  assignedTo,
  staff,
}: {
  caseId: string;
  assignedTo: string | null;
  staff: StaffOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/pa-tracker/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't update assignment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <select
        value={assignedTo ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="rounded-lg border border-divider bg-navy px-3 py-2 text-sm text-offwhite focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-gold">{error}</p>}
    </div>
  );
}
