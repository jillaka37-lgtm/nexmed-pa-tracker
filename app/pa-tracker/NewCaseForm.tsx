"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { StaffOption } from "@/lib/pa-tracker/staff";

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function NewCaseForm({ staff }: { staff: StaffOption[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const dueAtRaw = String(form.get("dueAt") ?? "");
    const assignedTo = String(form.get("assignedTo") ?? "");

    const body = {
      caseId: String(form.get("caseId") ?? ""),
      insurer: String(form.get("insurer") ?? ""),
      medication: String(form.get("medication") ?? ""),
      diagnosis: String(form.get("diagnosis") ?? "") || undefined,
      dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : undefined,
      assignedTo: assignedTo || undefined,
    };

    try {
      const res = await fetch("/api/pa-tracker/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong creating the case. Please try again.");
        setPending(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/pa-tracker/${id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="caseId" className="mb-1.5 block text-sm font-medium text-offwhite">
          Case reference
        </label>
        <input
          id="caseId"
          name="caseId"
          required
          className={fieldClass}
          placeholder="e.g. CASE-2026-0714 (no patient name)"
        />
      </div>

      <div>
        <label htmlFor="insurer" className="mb-1.5 block text-sm font-medium text-offwhite">
          Insurer
        </label>
        <input id="insurer" name="insurer" required className={fieldClass} placeholder="e.g. Blue Cross Blue Shield" />
      </div>

      <div>
        <label htmlFor="medication" className="mb-1.5 block text-sm font-medium text-offwhite">
          Medication
        </label>
        <input id="medication" name="medication" required className={fieldClass} placeholder="e.g. Ozempic 1mg, weekly" />
      </div>

      <div>
        <label htmlFor="diagnosis" className="mb-1.5 block text-sm font-medium text-offwhite">
          Diagnosis (optional)
        </label>
        <input id="diagnosis" name="diagnosis" className={fieldClass} placeholder="e.g. Type 2 diabetes mellitus" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="dueAt" className="mb-1.5 block text-sm font-medium text-offwhite">
            Follow up by (optional)
          </label>
          <input id="dueAt" name="dueAt" type="date" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="assignedTo" className="mb-1.5 block text-sm font-medium text-offwhite">
            Assign to (optional)
          </label>
          <select id="assignedTo" name="assignedTo" className={fieldClass}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold">{error}</div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating case…" : "Create case"}
      </Button>
    </form>
  );
}
