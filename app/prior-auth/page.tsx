import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Prior Authorization Drafts",
};

export default function PriorAuthPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          Staff tool
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">
          Draft a prior authorization letter
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Enter the case details below and get a first draft of the medical
          necessity letter in seconds. Always review before sending — this
          drafts the letter, it doesn&rsquo;t submit it.
        </p>
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
        <NewCaseForm />
      </div>

      <p className="mt-6 text-sm text-muted">
        Want to see what a finished draft looks like first?{" "}
        <Link href="/prior-auth/sample" className="text-teal hover:underline">
          View a sample draft
        </Link>
        .
      </p>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

function NewCaseForm() {
  return (
    <form className="space-y-5">
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

      <Button type="submit" size="lg" className="w-full" disabled>
        Generate draft — coming in Stage 2
      </Button>
      <p className="text-center text-xs text-muted">
        AI drafting isn&rsquo;t wired up yet. This form is UI-only for now.
      </p>
    </form>
  );
}
