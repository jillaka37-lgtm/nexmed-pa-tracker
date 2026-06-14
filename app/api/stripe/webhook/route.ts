import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmBooking } from "@/lib/bookings";
import { confirmOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await confirmBooking(
        bookingId,
        paymentIntent,
        session.customer_details?.email,
      );
    }
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await confirmOrder(orderId, paymentIntent, session.customer_details?.email);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = createAdminClient();
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await admin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("status", "pending_payment");
    }
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await admin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "pending_payment");
    }
  }

  return NextResponse.json({ received: true });
}
