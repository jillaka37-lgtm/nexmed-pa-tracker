import type { Metadata } from "next";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_TIMEZONE } from "@/lib/config";

export const metadata: Metadata = { title: "My dashboard" };

export default async function DashboardOverviewPage() {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: nextBooking }, { count: openRefills }, { count: unreadMessages }, { count: openOrders }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, start_at, status, services(title)")
        .eq("user_id", user!.id)
        .in("status", ["pending_payment", "confirmed"])
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("prescription_refills")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .in("status", ["received", "processing", "ready"]),
      supabase
        .from("patient_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("sender_role", "staff")
        .is("read_by_patient_at", null),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .in("status", ["pending_payment", "paid"]),
    ]);

  const booking = nextBooking as unknown as {
    id: string;
    start_at: string;
    services: { title: string } | null;
  } | null;

  const cards = [
    {
      label: "Next appointment",
      value: booking ? formatInTimeZone(new Date(booking.start_at), BUSINESS_TIMEZONE, "MMM d, h:mm a") : "None scheduled",
      href: "/dashboard/appointments",
    },
    { label: "Open refill requests", value: String(openRefills ?? 0), href: "/dashboard/refills" },
    { label: "Unread messages", value: String(unreadMessages ?? 0), href: "/dashboard/messages" },
    { label: "Orders in progress", value: String(openOrders ?? 0), href: "/dashboard/orders" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">Overview</h1>
      <p className="mt-2 text-muted">Your consultations, refills, orders, and messages, all in one place.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {booking && (
        <div className="mt-8 rounded-2xl border border-divider bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">Coming up</p>
          <h2 className="mt-2 text-lg font-semibold text-offwhite">{booking.services?.title ?? "Consultation"}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatInTimeZone(new Date(booking.start_at), BUSINESS_TIMEZONE, "EEEE, MMMM d · h:mm a")} ({BUSINESS_TIMEZONE})
          </p>
        </div>
      )}
    </div>
  );
}
