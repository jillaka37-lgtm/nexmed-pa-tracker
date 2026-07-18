import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPatient, getPatientProfile } from "@/lib/crm/patients";
import { listPatientTimeline } from "@/lib/crm/patientActivities";
import { ProfileForm } from "./ProfileForm";
import { ActivityForm } from "./ActivityForm";

export const metadata: Metadata = { title: "Patient · CRM" };

const ACTIVITY_ICON: Record<string, string> = { note: "📝", task: "☑️", reminder: "⏰" };

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const admin = createAdminClient();
  const [profile, timeline, { data: bookings }, { data: refills }, { data: orders }, { data: messages }] =
    await Promise.all([
      getPatientProfile(id),
      listPatientTimeline(id),
      admin
        .from("bookings")
        .select("id, start_at, status, services(title)")
        .eq("user_id", id)
        .order("start_at", { ascending: false })
        .limit(5),
      admin
        .from("prescription_refills")
        .select("id, medication_name, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("orders")
        .select("id, status, amount_cents, currency, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("patient_messages")
        .select("id, sender_role, body, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="max-w-4xl">
      <Link href="/crm/patients" className="text-sm text-teal hover:underline">← All patients</Link>

      <div className="mt-4 mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite">{patient.fullName || patient.email || "Patient"}</h1>
        <p className="mt-1 text-sm text-muted">{patient.email ?? "—"} {patient.phone ? `· ${patient.phone}` : ""}</p>
        <Link href={`/admin/messages/${id}`} className="mt-2 inline-block text-sm text-teal hover:underline">
          Message this patient →
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Patient profile</h2>
        <ProfileForm userId={id} profile={profile} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-divider bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-offwhite">Recent appointments</h3>
          {!bookings?.length ? (
            <p className="text-xs text-muted">None</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted">
              {(bookings as unknown as { id: string; start_at: string; status: string; services: { title: string } | null }[]).map((b) => (
                <li key={b.id}>{new Date(b.start_at).toLocaleDateString()} — {b.services?.title ?? "Consultation"} ({b.status})</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-divider bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-offwhite">Recent refills</h3>
          {!refills?.length ? (
            <p className="text-xs text-muted">None</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted">
              {refills.map((r) => (
                <li key={r.id}>{r.medication_name} ({r.status})</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-divider bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-offwhite">Recent orders</h3>
          {!orders?.length ? (
            <p className="text-xs text-muted">None</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted">
              {orders.map((o) => (
                <li key={o.id}>{new Date(o.created_at).toLocaleDateString()} — {o.status}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-divider bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-offwhite">Communication history</h3>
          <Link href={`/admin/messages/${id}`} className="text-xs text-teal hover:underline">View full thread →</Link>
        </div>
        {!messages?.length ? (
          <p className="text-xs text-muted">No messages yet.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {messages.map((m) => (
              <li key={m.id} className="text-muted">
                <span className="font-medium text-offwhite">{m.sender_role === "staff" ? "Staff" : "Patient"}:</span> {m.body}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Tasks, notes & reminders</h2>
        <div className="mb-6 rounded-2xl border border-divider bg-card p-6">
          <ActivityForm userId={id} />
        </div>
        {timeline.length === 0 ? (
          <p className="text-muted">Nothing logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((a) => (
              <li key={a.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-offwhite">{ACTIVITY_ICON[a.type]} {a.title}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">{a.type}{a.doneAt ? " · done" : ""}</span>
                </div>
                {a.body && <p className="mt-1 text-muted">{a.body}</p>}
                {a.dueAt && <p className="mt-1 text-xs text-muted">Due {new Date(a.dueAt).toLocaleString()}</p>}
                {a.remindAt && <p className="mt-1 text-xs text-muted">Remind {new Date(a.remindAt).toLocaleString()}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
