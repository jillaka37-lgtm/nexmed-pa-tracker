import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import {
  MeetingLinkForm,
  AvailabilityAddForm,
  DeleteRuleButton,
  ServiceForm,
} from "@/components/admin/forms";

export const metadata: Metadata = { title: "Admin" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/admin");
  if (!(await isAdmin())) redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { data: bookingRows },
    { data: rules },
    { data: services },
    { data: refills },
    { data: orderRows },
    { data: products },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, start_at, status, amount_cents, currency, meeting_link, user_id, service_id",
      )
      .order("start_at", { ascending: false })
      .limit(100),
    admin
      .from("availability_rules")
      .select("id, weekday, start_time, end_time, slot_minutes")
      .order("weekday")
      .order("start_time"),
    admin
      .from("services")
      .select("id, slug, title, description, duration_min, price_cents, active")
      .order("sort_order"),
    admin
      .from("prescription_refills")
      .select(
        "id, created_at, full_name, email, phone, medication_name, dosage, fulfilment, status",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("orders")
      .select(
        "id, created_at, email, status, amount_cents, currency, order_items(name, quantity, unit_amount_cents)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("products")
      .select(
        "id, name, category, price_cents, currency, stock, requires_rx, active",
      )
      .order("sort_order", { ascending: true }),
  ]);

  const bookings = bookingRows ?? [];
  const orders = orderRows ?? [];

  // Resolve client + service labels (no direct FK join between bookings/profiles).
  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const serviceIds = [
    ...new Set(bookings.map((b) => b.service_id).filter(Boolean)),
  ];
  const [{ data: profiles }, { data: bookingServices }] = await Promise.all([
    userIds.length
      ? admin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    serviceIds.length
      ? admin.from("services").select("id, title").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const serviceTitleById = new Map(
    (bookingServices ?? []).map((s) => [s.id, s.title]),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted">
        Manage bookings, availability, and services.
      </p>

      {/* Bookings */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Bookings</h2>
        <div className="mt-4 space-y-4">
          {bookings.length === 0 ? (
            <p className="text-muted">No bookings yet.</p>
          ) : (
            bookings.map((b) => {
              const p = profileById.get(b.user_id);
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-divider bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-offwhite">
                        {serviceTitleById.get(b.service_id ?? "") ??
                          "Consultation"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatInTimeZone(
                          new Date(b.start_at),
                          BUSINESS_TIMEZONE,
                          "EEE, MMM d · h:mm a",
                        )}{" "}
                        · {p?.full_name ?? "Unknown"} ({p?.email ?? "no email"})
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="block font-mono text-gold">
                        {formatPrice(b.amount_cents, b.currency)}
                      </span>
                      <span className="text-muted">{b.status}</span>
                    </div>
                  </div>
                  {b.status === "confirmed" && (
                    <MeetingLinkForm
                      bookingId={b.id}
                      current={b.meeting_link}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Refill requests */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Refill requests</h2>
        <div className="mt-4 space-y-3">
          {(refills ?? []).length === 0 ? (
            <p className="text-muted">No refill requests yet.</p>
          ) : (
            (refills ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-divider bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-offwhite">
                      {r.medication_name}
                      {r.dosage ? (
                        <span className="text-muted"> · {r.dosage}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {r.full_name} · {r.email} · {r.phone}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="block capitalize text-sky">
                      {r.fulfilment}
                    </span>
                    <span className="text-muted">{r.status}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatInTimeZone(
                    new Date(r.created_at),
                    BUSINESS_TIMEZONE,
                    "EEE, MMM d · h:mm a",
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Shop orders */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Shop orders</h2>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="text-muted">No orders yet.</p>
          ) : (
            orders.map((o) => {
              const items =
                (o.order_items as {
                  name: string;
                  quantity: number;
                  unit_amount_cents: number;
                }[]) ?? [];
              return (
                <div
                  key={o.id}
                  className="rounded-2xl border border-divider bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-offwhite">
                        {o.email ?? "Guest order"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatInTimeZone(
                          new Date(o.created_at),
                          BUSINESS_TIMEZONE,
                          "EEE, MMM d · h:mm a",
                        )}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="block font-mono text-gold">
                        {formatPrice(o.amount_cents, o.currency)}
                      </span>
                      <span className="text-muted">{o.status}</span>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-divider pt-3 text-sm text-muted">
                      {items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span className="font-mono">
                            {formatPrice(
                              it.unit_amount_cents * it.quantity,
                              o.currency,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Availability */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Weekly availability</h2>
        <div className="mt-4 rounded-2xl border border-divider bg-surface p-5">
          {(rules ?? []).length === 0 ? (
            <p className="text-sm text-muted">
              No rules yet. Bookings fall back to Mon to Fri, 9 to 5.
            </p>
          ) : (
            <ul className="space-y-2">
              {(rules ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between border-b border-divider pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-offwhite">
                    <span className="font-medium">{WEEKDAYS[r.weekday]}</span>{" "}
                    {r.start_time.slice(0, 5)} to {r.end_time.slice(0, 5)}{" "}
                    <span className="text-muted">
                      ({r.slot_minutes} min slots)
                    </span>
                  </span>
                  <DeleteRuleButton id={r.id} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-divider pt-5">
            <AvailabilityAddForm />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Services</h2>
        <div className="mt-4 space-y-4">
          {(services ?? []).map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-divider bg-surface p-5"
            >
              <ServiceForm
                service={{
                  id: s.id,
                  title: s.title,
                  description: s.description,
                  duration_min: s.duration_min,
                  price_cents: s.price_cents,
                  active: s.active,
                }}
              />
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-divider bg-surface/50 p-5">
            <p className="mb-3 text-sm font-medium text-muted">
              Add a new service
            </p>
            <ServiceForm />
          </div>
        </div>
      </section>

      {/* Shop products */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Shop products</h2>
        <p className="mt-1 text-sm text-muted">
          Catalog is seeded via the database. Edit products in Supabase to change
          price, stock, or availability.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-divider bg-surface">
          {(products ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted">
              No products yet. Run the shop migration to seed the catalog.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-muted">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-divider last:border-0"
                  >
                    <td className="p-4 text-offwhite">
                      {p.name}
                      {p.requires_rx && (
                        <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                          Rx
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted">{p.category}</td>
                    <td className="p-4 font-mono text-gold">
                      {formatPrice(p.price_cents, p.currency)}
                    </td>
                    <td className="p-4 text-muted">{p.stock}</td>
                    <td className="p-4">
                      <span className={p.active ? "text-health" : "text-muted"}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
