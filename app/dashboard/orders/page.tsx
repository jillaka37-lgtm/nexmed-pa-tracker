import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gold/15 text-gold",
  paid: "bg-sky/15 text-sky",
  fulfilled: "bg-health/15 text-health",
  cancelled: "bg-divider text-muted",
};

type OrderItem = { name: string; quantity: number; unit_amount_cents: number };
type Order = {
  id: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  order_items: OrderItem[];
};

export default async function OrdersPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, amount_cents, currency, created_at, order_items(name, quantity, unit_amount_cents)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as Order[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-offwhite">Orders</h1>
          <p className="mt-2 text-muted">Your shop orders and their status.</p>
        </div>
        <ButtonLink href="/shop" size="sm">Browse shop</ButtonLink>
      </div>

      <div className="mt-8 space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-surface p-10 text-center">
            <p className="text-muted">No orders yet.</p>
            <ButtonLink href="/shop" size="lg" className="mt-6">Browse shop</ButtonLink>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-divider bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString()}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[o.status] ?? "bg-divider text-muted"}`}>
                  {o.status.replace("_", " ")}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-offwhite">
                {o.order_items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="text-muted">{formatPrice(item.unit_amount_cents * item.quantity, o.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end border-t border-divider pt-3">
                <span className="font-mono text-gold">{formatPrice(o.amount_cents, o.currency)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
