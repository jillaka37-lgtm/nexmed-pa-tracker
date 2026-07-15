"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function NewCaseForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const intake = {
      caseId: String(form.get("caseId") ?? ""),
      insurer: String(form.get("insurer") ?? ""),
      medication: String(form.get("medication") ?? ""),
      diagnosis: String(form.get("diagnosis") ?? ""),
      priorTreatments: String(form.get("priorTreatments") ?? ""),
      notes: String(form.get("notes") ?? "") || undefined,
    };

    try {
      const res = await fetch("/api/prior-auth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          body?.error ??
            "Something went wrong generating the draft. Please try again in a moment.",
        );
        setPending(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/prior-auth/${id}`);
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="caseId" className="mb-1.5 block text-sm font-medium text-offwhite">
          Case ID
        </label>
        <input
          id="caseId"
          name="caseId"
          required
          className={fieldClass}
          placeholder="e.g. CASE-2026-0714 (no patient name — case ID only)"
        />
        <p className="mt-1 text-xs text-muted">
          Use an internal case reference, not the patient&rsquo;s name — drafts don&rsquo;t store identifying details yet.
        </p>
      </div>

      <div>
        <label htmlFor="insurer" className="mb-1.5 block text-sm font-medium text-offwhite">
          Insurer
        </label>
        <input
          id="insurer"
          name="insurer"
          required
          className={fieldClass}
          placeholder="e.g. Blue Cross Blue Shield"
        />
      </div>

      <div>
        <label htmlFor="medication" className="mb-1.5 block text-sm font-medium text-offwhite">
          Medication requested
        </label>
        <input
          id="medication"
          name="medication"
          required
          className={fieldClass}
          placeholder="e.g. Ozempic 1mg, weekly"
        />
      </div>

      <div>
        <label htmlFor="diagnosis" className="mb-1.5 block text-sm font-medium text-offwhite">
          Diagnosis
        </label>
        <input
          id="diagnosis"
          name="diagnosis"
          required
          className={fieldClass}
          placeholder="e.g. Type 2 diabetes mellitus, uncontrolled"
        />
      </div>

      <div>
        <label htmlFor="priorTreatments" className="mb-1.5 block text-sm font-medium text-offwhite">
          Prior treatments tried
        </label>
        <textarea
          id="priorTreatments"
          name="priorTreatments"
          required
          rows={4}
          className={fieldClass}
          placeholder="e.g. Metformin 1000mg x6 months — insufficient A1C control. Glipizide added x3 months — still above target."
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-offwhite">
          Additional clinical notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={fieldClass}
          placeholder="Anything else relevant to medical necessity"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Generating draft…" : "Generate draft"}
      </Button>
    </form>
  );
}
