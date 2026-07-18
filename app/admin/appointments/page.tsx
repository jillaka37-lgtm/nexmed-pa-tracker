import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { MeetingLinkForm } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Appointments · Staff" };

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-health/15 text-health",
  pending_payment: "bg-gold/15 text-gold",
  completed: "bg-sky/15 text-sky",
  cancelled: "bg-divider text-muted",
};

export default async function StaffAppointmentsPage() {
  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, start_at, status, amount_cents, currency, meeting_link, user_id, service_id")
    .order("start_at", { ascending: false })
    .limit(100);

  const rows = bookings ?? [];
  const userIds = [...new Set(rows.map((b) => b.user_id))];
  const serviceIds = [...new Set(rows.map((b) => b.service_id).filter(Boolean))];
  const [{ data: profiles }, { data: services }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    serviceIds.length
      ? admin.from("services").select("id, title").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s.title]));

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Appointments</h1>
      <p className="mb-8 text-muted">Every booking across all patients. Send meeting links here.</p>

      {rows.length === 0 ? (
        <p className="text-muted">No appointments yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => {
            const profile = profileMap.get(b.user_id);
            return (
              <div key={b.id} className="rounded-2xl border border-divider bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-offwhite">{profile?.full_name || profile?.email || b.user_id}</p>
                    <p className="mt-1 text-sm text-muted">
                      {b.service_id ? serviceMap.get(b.service_id) ?? "Consultation" : "Consultation"} ·{" "}
                      {new Date(b.start_at).toLocaleString()} · {formatPrice(b.amount_cents, b.currency)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[b.status] ?? "bg-divider text-muted"}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
                {b.status === "confirmed" && <MeetingLinkForm bookingId={b.id} current={b.meeting_link} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
