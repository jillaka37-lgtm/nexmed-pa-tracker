import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUser, isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getOwnCase, listEvents } from "@/lib/pa-tracker/cases";
import { listStaff } from "@/lib/pa-tracker/staff";
import { Button } from "@/components/ui/button";
import { StatusControls } from "./StatusControls";
import { AssignControl } from "./AssignControl";
import { NoteForm } from "./NoteForm";
import { AiActions } from "./AiActions";

export const metadata: Metadata = { title: "PA Case" };

function describeEvent(e: { action: string; detail: Record<string, unknown> | null }): string {
  switch (e.action) {
    case "created":
      return "Case created";
    case "status_changed":
      return `Status changed: ${e.detail?.from} → ${e.detail?.to}`;
    case "assigned":
      return e.detail?.to ? "Assigned to a staff member" : "Unassigned";
    case "note_added":
      return String(e.detail?.text ?? "Note added");
    case "reminder_sent":
      return "Reminder sent";
    case "ai_action":
      return `AI action: ${e.detail?.type ?? "unknown"}`;
    default:
      return e.action;
  }
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/pa-tracker");
  if (!(await isAdmin())) redirect("/login?redirect=/pa-tracker");

  const user = await getUser();
  const { id } = await params;
  const [paCase, staff] = await Promise.all([getOwnCase(id, user!.id), listStaff()]);
  if (!paCase) notFound();

  const events = await listEvents(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Case</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">{paCase.caseId}</h1>
        </div>
        <Link href="/pa-tracker" className="text-sm text-teal hover:underline">
          ← All cases
        </Link>
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
        <dl className="grid grid-cols-1 gap-4 border-b border-divider pb-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Insurer</dt>
            <dd className="mt-1 text-sm text-offwhite">{paCase.insurer}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Medication</dt>
            <dd className="mt-1 text-sm text-offwhite">{paCase.medication}</dd>
          </div>
          {paCase.diagnosis && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Diagnosis</dt>
              <dd className="mt-1 text-sm text-offwhite">{paCase.diagnosis}</dd>
            </div>
          )}
        </dl>

        <div className="space-y-6 pt-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky">Status</h2>
            <StatusControls caseId={paCase.id} status={paCase.status} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky">Assigned to</h2>
            <AssignControl caseId={paCase.id} assignedTo={paCase.assignedTo} staff={staff} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky">AI assist</h2>
            <AiActions caseId={paCase.id} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky">Timeline</h2>
            <div className="mb-3">
              <NoteForm caseId={paCase.id} />
            </div>
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 text-sm text-offwhite/90">
                  <span>{describeEvent(e as { action: string; detail: Record<string, unknown> | null })}</span>
                  <span className="shrink-0 text-xs text-muted">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/pa-tracker">
          <Button variant="ghost">Back to cases</Button>
        </Link>
      </div>
    </div>
  );
}
