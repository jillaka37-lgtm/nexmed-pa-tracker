import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export async function StaffOverview() {
  const admin = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: todaysAppointments },
    { count: openRefills },
    { count: unreadStaffMessages },
    { count: newLeads },
    { count: openTasks },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_payment", "confirmed"])
      .gte("start_at", todayStart.toISOString())
      .lte("start_at", todayEnd.toISOString()),
    admin
      .from("prescription_refills")
      .select("id", { count: "exact", head: true })
      .in("status", ["received", "processing", "ready"]),
    admin
      .from("patient_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_role", "patient")
      .is("read_by_staff_at", null),
    admin.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin
      .from("patient_activities")
      .select("id", { count: "exact", head: true })
      .eq("type", "task")
      .is("done_at", null),
  ]);

  const cards = [
    { label: "Today's appointments", value: String(todaysAppointments ?? 0), href: "/admin/appointments" },
    { label: "Open refill requests", value: String(openRefills ?? 0), href: "/admin/refills" },
    { label: "Unread patient messages", value: String(unreadStaffMessages ?? 0), href: "/admin/messages" },
    { label: "New leads", value: String(newLeads ?? 0), href: "/crm" },
    { label: "Open tasks", value: String(openTasks ?? 0), href: "/crm/tasks" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">Overview</h1>
      <p className="mt-2 text-muted">Operations and CRM, at a glance.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-divider bg-surface p-6 transition-colors hover:border-teal/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-offwhite">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
