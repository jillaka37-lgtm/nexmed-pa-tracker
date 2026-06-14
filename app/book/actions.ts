"use server";

import { formatInTimeZone } from "date-fns-tz";
import { getSlotsForDate } from "@/lib/availability";
import { getServiceBySlug } from "@/lib/services";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { stripe, hasStripeEnv, getSiteUrl } from "@/lib/stripe";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import type { Slot } from "@/lib/slots";

export async function fetchSlots(
  serviceSlug: string,
  dateStr: string,
): Promise<Slot[]> {
  if (!serviceSlug || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];
  return getSlotsForDate(serviceSlug, dateStr);
}

export type CheckoutResult = {
  url?: string;
  redirectTo?: string;
  error?: string;
};

export async function startCheckout(
  serviceSlug: string,
  startISO: string,
): Promise<CheckoutResult> {
  const backHere = `/book?service=${encodeURIComponent(serviceSlug)}`;

  const user = await getUser();
  if (!user) {
    return { redirectTo: `/login?redirect=${encodeURIComponent(backHere)}` };
  }

  if (!hasSupabaseEnv || !hasStripeEnv || !stripe) {
    return {
      error:
        "Booking isn't fully configured yet. Add your Supabase and Stripe keys to .env.local.",
    };
  }

  const service = await getServiceBySlug(serviceSlug);
  if (!service) return { error: "That service is no longer available." };

  // Re-validate the slot server-side to prevent tampering / double-booking.
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return { error: "Invalid time slot." };
  const dateStr = formatInTimeZone(start, BUSINESS_TIMEZONE, "yyyy-MM-dd");
  const slots = await getSlotsForDate(serviceSlug, dateStr);
  const chosen = slots.find((s) => s.startISO === startISO);
  if (!chosen) {
    return { error: "That time was just taken. Please choose another slot." };
  }

  const admin = createAdminClient();

  // Hold the slot with a pending_payment booking.
  const { data: booking, error: insertError } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      service_id: service.id,
      start_at: chosen.startISO,
      end_at: chosen.endISO,
      status: "pending_payment",
      amount_cents: service.price_cents,
      currency: service.currency,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    // Overlap exclusion constraint → slot taken between fetch and insert.
    return { error: "That time was just taken. Please choose another slot." };
  }

  const site = getSiteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: service.currency,
            unit_amount: service.price_cents,
            product_data: {
              name: service.title,
              description: `${service.duration_min}-minute consultation · ${chosen.label} (${BUSINESS_TIMEZONE})`,
            },
          },
        },
      ],
      metadata: { booking_id: booking.id },
      success_url: `${site}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/booking/cancelled?booking=${booking.id}`,
    });

    await admin
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    if (!session.url) return { error: "Could not start checkout." };
    return { url: session.url };
  } catch {
    // Roll back the held slot if Stripe failed.
    await admin.from("bookings").delete().eq("id", booking.id);
    return { error: "Could not start checkout. Please try again." };
  }
}
