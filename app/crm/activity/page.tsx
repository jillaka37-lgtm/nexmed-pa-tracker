import Link from "next/link";
import type { Metadata } from "next";
import { listPatientActivitiesByType } from "@/lib/crm/patientActivities";
import { CompleteActivityButton } from "@/app/crm/CompleteActivityButton";
import type { PatientActivityType } from "@/lib/crm/types";

export const metadata: Metadata = { title: "Activity · CRM" };

const TABS: { type: PatientActivityType; label: string }[] = [
  { type: "task", label: "Tasks & Follow-ups" },
  { type: "note", label: "Notes" },
  { type: "reminder", label: "Reminders" },
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const type: PatientActivityType = TABS.some((t) => t.type === rawType) ? (rawType as PatientActivityType) : "task";

  const activities = await listPatientActivitiesByType(type);
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const now = Date.now();
  const open = activities.filter((a) => !a.doneAt);
  const done = activities.filter((a) => a.doneAt);
  const showDoneToggle = type !== "note";

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Activity</h1>
      <p className="mb-6 text-muted">Tasks, notes, and reminders across all patients. Add new ones from a patient&apos;s profile.</p>

      <div className="mb-8 flex gap-2 border-b border-divider">
        {TABS.map((t) => (
          <Link
            key={t.type}
            href={`/crm/activity?type=${t.type}`}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              type === t.type ? "border-teal text-teal" : "border-transparent text-muted hover:text-offwhite"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activities.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : showDoneToggle ? (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Open ({open.length})</h2>
          {open.length === 0 ? (
            <p className="mb-8 text-muted">Nothing open.</p>
          ) : (
            <ul className="mb-8 space-y-2">
              {open.map((a) => {
                const overdue = a.dueAt ? new Date(a.dueAt).getTime() < now : false;
                const when = a.dueAt ?? a.remindAt;
                return (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-divider bg-card px-4 py-3 text-sm">
                    <div>
                      <Link href={`/crm/patients/${a.userId}`} className="font-medium text-teal hover:underline">
                        {a.patientName ?? "Patient"}
                      </Link>
                      <span className="mx-2 text-muted">·</span>
                      <span className="text-offwhite">{a.title}</span>
                      {when && (
                        <span className={`ml-2 text-xs ${overdue ? "text-red-400" : "text-muted"}`}>
                          {type === "task" ? "due" : "remind"} {new Date(when).toLocaleString()}
                        </span>
                      )}
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
        </>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/crm/patients/${a.userId}`} className="font-medium text-teal hover:underline">
                  {a.patientName ?? "Patient"}
                </Link>
                <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-offwhite">{a.title}</p>
              {a.body && <p className="mt-1 text-muted">{a.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
