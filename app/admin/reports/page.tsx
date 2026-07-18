import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Reports · Staff" };

function countBy<T extends { status: string }>(rows: T[] | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows ?? []) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="capitalize">{label.replace("_", " ")}</span>
        <span>{count}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-navy">
        <div className="h-2 rounded-full bg-teal" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatSection({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  const max = Math.max(1, ...entries.map(([, c]) => c));
  return (
    <div className="rounded-2xl border border-divider bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-offwhite">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-muted">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([status, count]) => (
            <Bar key={status} label={status} count={count} max={max} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ReportsPage() {
  const admin = createAdminClient();

  const [
    { data: bookings },
    { data: refills },
    { data: orders },
    { data: leads },
    { count: patientCount },
  ] = await Promise.all([
    admin.from("bookings").select("status, amount_cents"),
    admin.from("prescription_refills").select("status"),
    admin.from("orders").select("status, amount_cents"),
    admin.from("leads").select("status"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
  ]);

  const bookingRevenue = (bookings ?? [])
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.amount_cents, 0);
  const orderRevenue = (orders ?? [])
    .filter((o) => o.status === "paid" || o.status === "fulfilled")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const bookingCounts = countBy(bookings);
  const refillCounts = countBy(refills);
  const orderCounts = countBy(orders);
  const leadCounts = countBy(leads);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Reports</h1>
      <p className="mb-8 text-muted">Key numbers across appointments, refills, orders, and leads.</p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-divider bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Appointment revenue</p>
          <p className="mt-2 text-2xl font-bold text-offwhite">{formatPrice(bookingRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-divider bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Shop revenue</p>
          <p className="mt-2 text-2xl font-bold text-offwhite">{formatPrice(orderRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-divider bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Registered patients</p>
          <p className="mt-2 text-2xl font-bold text-offwhite">{patientCount ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatSection title="Appointments by status" counts={bookingCounts} />
        <StatSection title="Refill requests by status" counts={refillCounts} />
        <StatSection title="Orders by status" counts={orderCounts} />
        <StatSection title="Leads by status" counts={leadCounts} />
      </div>
    </div>
  );
}
