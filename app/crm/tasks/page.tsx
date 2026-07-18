import type { Metadata } from "next";
import Link from "next/link";
import { listPatientActivitiesByType } from "@/lib/crm/patientActivities";
import { CompleteActivityButton } from "@/app/crm/CompleteActivityButton";

export const metadata: Metadata = { title: "Tasks & Follow-ups · CRM" };

export default async function TasksPage() {
  const activities = await listPatientActivitiesByType("task");
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const now = Date.now();
  const open = activities.filter((a) => !a.doneAt);
  const done = activities.filter((a) => a.doneAt);

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Tasks &amp; Follow-ups</h1>
      <p className="mb-8 text-muted">Across all patients. Add new ones from a patient&apos;s profile.</p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Open ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mb-8 text-muted">Nothing open.</p>
      ) : (
        <ul className="mb-8 space-y-2">
          {open.map((a) => {
            const overdue = a.dueAt ? new Date(a.dueAt).getTime() < now : false;
            return (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-divider bg-card px-4 py-3 text-sm">
                <div>
                  <Link href={`/crm/patients/${a.userId}`} className="font-medium text-teal hover:underline">{a.patientName ?? "Patient"}</Link>
                  <span className="mx-2 text-muted">·</span>
                  <span className="text-offwhite">{a.title}</span>
                  {a.dueAt && <span className={`ml-2 text-xs ${overdue ? "text-red-400" : "text-muted"}`}>due {new Date(a.dueAt).toLocaleDateString()}</span>}
                </div>
                <CompleteActivityButton activityId={a.id} />
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Done ({done.length})</h2>
          <ul className="space-y-2">
            {done.map((a) => (
              <li key={a.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm text-muted">
                {a.patientName ?? "Patient"} · {a.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
