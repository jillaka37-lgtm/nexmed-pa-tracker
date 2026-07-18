import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders · Staff" };

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gold/15 text-gold",
  paid: "bg-sky/15 text-sky",
  fulfilled: "bg-health/15 text-health",
  cancelled: "bg-divider text-muted",
};

export default async function StaffOrdersPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, email, status, amount_cents, currency, created_at, order_items(name, quantity, unit_amount_cents)")
    .order("created_at", { ascending: false })
    .limit(100);

  type Row = {
    id: string;
    email: string | null;
    status: string;
    amount_cents: number;
    currency: string;
    created_at: string;
    order_items: { name: string; quantity: number; unit_amount_cents: number }[];
  };
  const orders = (data ?? []) as unknown as Row[];

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Orders</h1>
      <p className="mb-8 text-muted">Every shop order, across all customers.</p>

      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-divider bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-offwhite">{o.email ?? "—"}</p>
                  <p className="text-xs text-muted">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[o.status] ?? "bg-divider text-muted"}`}>
                  {o.status.replace("_", " ")}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {o.order_items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{formatPrice(item.unit_amount_cents * item.quantity, o.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end border-t border-divider pt-3">
                <span className="font-mono text-gold">{formatPrice(o.amount_cents, o.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
