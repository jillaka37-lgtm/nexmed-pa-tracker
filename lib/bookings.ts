import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email";

export type ConfirmedBooking = {
  id: string;
  start_at: string;
  amount_cents: number;
  currency: string;
  serviceTitle: string;
  email: string | null;
  name: string | null;
};

/**
 * Confirm a paid booking. Idempotent: the status flip only matches a still
 * `pending_payment` row, so the confirmation email is sent at most once even if
 * both the webhook and the success page call this.
 */
export async function confirmBooking(
  bookingId: string,
  paymentIntent: string | null,
  fallbackEmail?: string | null,
): Promise<ConfirmedBooking | null> {
  const admin = createAdminClient();

  const { data: flipped } = await admin
    .from("bookings")
    .update({ status: "confirmed", stripe_payment_intent: paymentIntent })
    .eq("id", bookingId)
    .eq("status", "pending_payment")
    .select("id, start_at, amount_cents, currency, service_id, user_id")
    .maybeSingle();

  // Load the (now confirmed) booking for display regardless of who flipped it.
  const { data: booking } = await admin
    .from("bookings")
    .select("id, start_at, amount_cents, currency, service_id, user_id, status")
    .eq("id", bookingId)
    .single();
  if (!booking) return null;

  const [{ data: service }, { data: profile }] = await Promise.all([
    admin.from("services").select("title").eq("id", booking.service_id).single(),
    admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", booking.user_id)
      .single(),
  ]);

  const email = profile?.email ?? fallbackEmail ?? null;
  const result: ConfirmedBooking = {
    id: booking.id,
    start_at: booking.start_at,
    amount_cents: booking.amount_cents,
    currency: booking.currency,
    serviceTitle: service?.title ?? "Consultation",
    email,
    name: profile?.full_name ?? null,
  };

  // Only the call that actually flipped pending→confirmed sends the email.
  if (flipped && email) {
    await sendBookingConfirmation({
      to: email,
      name: result.name,
      serviceTitle: result.serviceTitle,
      startAt: new Date(result.start_at),
      amountCents: result.amount_cents,
      currency: result.currency,
    });
  }

  return result;
}
