import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sample Prior Authorization Draft",
};

const SAMPLE = {
  caseId: "CASE-2026-0714",
  insurer: "Blue Cross Blue Shield",
  medication: "Ozempic (semaglutide) 1mg, weekly injection",
  diagnosis: "Type 2 diabetes mellitus, uncontrolled (ICD-10 E11.65)",
  priorTreatments: [
    "Metformin 1000mg twice daily for 6 months — A1C remained above target (8.9%).",
    "Glipizide 5mg added for 3 months — A1C improved marginally to 8.2%, still above the 7.0% goal.",
  ],
  medicalNecessitySummary:
    "The patient has type 2 diabetes mellitus that has remained uncontrolled despite six months of metformin therapy and an additional three months of combination therapy with glipizide. Glycemic targets have not been met on two first-line oral agents. Semaglutide is medically necessary to achieve adequate glycemic control and reduce the risk of diabetes-related complications, consistent with current standard-of-care escalation guidelines.",
  missingInfoWarnings: [
    "No documented A1C value within the last 90 days — insurers frequently require a recent lab result. Consider attaching the most recent A1C before submission.",
  ],
};

export default function SampleDraftPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Sample draft
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">
            Prior authorization letter
          </h1>
        </div>
        <span className="shrink-0 rounded-full border border-divider bg-navy px-3 py-1 text-xs font-medium text-muted">
          {SAMPLE.caseId}
        </span>
      </div>

      {SAMPLE.missingInfoWarnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm font-semibold text-gold">Before you submit</p>
          <ul className="mt-1 list-inside list-disc text-sm text-offwhite/90">
            {SAMPLE.missingInfoWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
        <dl className="grid grid-cols-1 gap-4 border-b border-divider pb-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Insurer
            </dt>
            <dd className="mt-1 text-sm text-offwhite">{SAMPLE.insurer}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Medication requested
            </dt>
            <dd className="mt-1 text-sm text-offwhite">{SAMPLE.medication}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Diagnosis
            </dt>
            <dd className="mt-1 text-sm text-offwhite">{SAMPLE.diagnosis}</dd>
          </div>
        </dl>

        <div className="space-y-6 pt-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky">
              Medical necessity
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-offwhite/90">
              {SAMPLE.medicalNecessitySummary}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky">
              Prior treatments tried
            </h2>
            <ul className="mt-2 space-y-2">
              {SAMPLE.priorTreatments.map((treatment) => (
                <li
                  key={treatment}
                  className="flex gap-2 text-sm leading-relaxed text-offwhite/90"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                  {treatment}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" disabled>
          Export to PDF — coming soon
        </Button>
        <Link href="/prior-auth">
          <Button variant="ghost">Back to new case form</Button>
        </Link>
      </div>
    </div>
  );
}
