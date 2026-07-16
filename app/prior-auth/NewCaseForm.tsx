"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

const SAMPLE_CASE = {
  caseId: "CASE-DEMO-0001",
  insurer: "Blue Cross Blue Shield",
  medication: "Ozempic (semaglutide) 1mg, weekly injection",
  diagnosis: "Type 2 diabetes mellitus, uncontrolled (ICD-10 E11.65)",
  priorTreatments:
    "Metformin 1000mg twice daily for 6 months — A1C remained above target (8.9%). Glipizide 5mg added for 3 months — A1C improved marginally to 8.2%, still above the 7.0% goal.",
  notes: "Patient reports mild GI upset on metformin, tolerated.",
};

const STEPS = ["Intake", "Generate", "Share"] as const;

function ProgressSteps({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const isActive = step === activeStep;
        const isDone = step < activeStep;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                isDone
                  ? "bg-teal text-navy"
                  : isActive
                    ? "border border-teal text-teal"
                    : "border border-divider text-muted"
              }`}
            >
              {isDone ? "✓" : step}
            </span>
            <span className={isActive ? "text-offwhite" : "text-muted"}>{label}</span>
            {step < 3 && <span className="mx-1 h-px w-6 bg-divider" />}
          </li>
        );
      })}
    </ol>
  );
}

export function NewCaseForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillSampleCase() {
    const form = formRef.current;
    if (!form) return;
    for (const [key, value] of Object.entries(SAMPLE_CASE)) {
      const field = form.elements.namedItem(key) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (field) field.value = value;
    }
  }

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
    <div>
      <ProgressSteps activeStep={pending ? 2 : 1} />

      <button
        type="button"
        onClick={fillSampleCase}
        className="mb-5 text-sm text-teal hover:underline"
      >
        Try it with a sample case →
      </button>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
    </div>
  );
}
