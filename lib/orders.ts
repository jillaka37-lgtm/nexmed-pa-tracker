import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmation } from "@/lib/email";

export type ConfirmedOrder = {
  id: string;
  amount_cents: number;
  currency: string;
  email: string | null;
  items: { name: string; quantity: number; unit_amount_cents: number }[];
};

/**
 * Mark a paid order as `paid`. Idempotent: the status flip only matches a still
 * `pending_payment` row, so the confirmation email is sent at most once.
 */
export async function confirmOrder(
  orderId: string,
  paymentIntent: string | null,
  fallbackEmail?: string | null,
): Promise<ConfirmedOrder | null> {
  const admin = createAdminClient();

  const { data: flipped } = await admin
    .from("orders")
    .update({ status: "paid", stripe_payment_intent: paymentIntent })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();

  const { data: order } = await admin
    .from("orders")
    .select("id, amount_cents, currency, email")
    .eq("id", orderId)
    .single();
  if (!order) return null;

  const { data: items } = await admin
    .from("order_items")
    .select("name, quantity, unit_amount_cents")
    .eq("order_id", orderId);

  const result: ConfirmedOrder = {
    id: order.id,
    amount_cents: order.amount_cents,
    currency: order.currency,
    email: order.email ?? fallbackEmail ?? null,
    items: items ?? [],
  };

  if (flipped && result.email) {
    await sendOrderConfirmation({
      to: result.email,
      items: result.items,
      amountCents: result.amount_cents,
      currency: result.currency,
    });
  }

  return result;
}
