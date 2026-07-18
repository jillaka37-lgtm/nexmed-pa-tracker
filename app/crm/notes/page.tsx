import type { Metadata } from "next";
import Link from "next/link";
import { listPatientActivitiesByType } from "@/lib/crm/patientActivities";

export const metadata: Metadata = { title: "Notes · CRM" };

export default async function NotesPage() {
  const notes = await listPatientActivitiesByType("note");

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Notes</h1>
      <p className="mb-8 text-muted">Across all patients. Add new ones from a patient&apos;s profile.</p>

      {notes.length === 0 ? (
        <p className="text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/crm/patients/${n.userId}`} className="font-medium text-teal hover:underline">{n.patientName ?? "Patient"}</Link>
                <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-offwhite">{n.title}</p>
              {n.body && <p className="mt-1 text-muted">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
