import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getDraft } from "@/lib/prior-auth/store";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Prior Authorization Draft" };

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/prior-auth");
  if (!(await isAdmin())) redirect("/login?redirect=/prior-auth");

  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Draft
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">
            Prior authorization letter
          </h1>
        </div>
        <span className="shrink-0 rounded-full border border-divider bg-navy px-3 py-1 text-xs font-medium text-muted">
          {draft.caseId}
        </span>
      </div>

      {draft.missingInfoWarnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm font-semibold text-gold">Before you submit</p>
          <ul className="mt-1 list-inside list-disc text-sm text-offwhite/90">
            {draft.missingInfoWarnings.map((warning) => (
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
            <dd className="mt-1 text-sm text-offwhite">{draft.insurer}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Medication requested
            </dt>
            <dd className="mt-1 text-sm text-offwhite">{draft.medication}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Diagnosis
            </dt>
            <dd className="mt-1 text-sm text-offwhite">{draft.diagnosis}</dd>
          </div>
        </dl>

        <div className="space-y-6 pt-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky">
              Medical necessity
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-offwhite/90">
              {draft.medicalNecessitySummary}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky">
              Prior treatments tried
            </h2>
            <ul className="mt-2 space-y-2">
              {draft.priorTreatmentSummary.map((treatment) => (
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

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky">
              Full letter
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-offwhite/90">
              {draft.letterBody}
            </p>
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
