import Link from "next/link";
import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { ButtonLink } from "@/components/ui/button";
import { stripe } from "@/lib/stripe";
import { confirmBooking } from "@/lib/bookings";
import { formatPrice } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/config";

export const metadata: Metadata = { title: "Booking confirmed" };

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let booking = null;

  if (session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const bookingId = session.metadata?.booking_id;
      if (bookingId && session.payment_status === "paid") {
        const paymentIntent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;
        booking = await confirmBooking(
          bookingId,
          paymentIntent,
          session.customer_details?.email,
        );
      }
    } catch {
      // fall through to generic confirmation
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-health/15">
        <svg viewBox="0 0 24 24" className="h-9 w-9 fill-health" aria-hidden>
          <path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l9-9a1 1 0 10-1.4-1.4L9 16.2z" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold">You&rsquo;re booked!</h1>
      <p className="mt-3 text-muted">
        Your payment was successful and your consultation is confirmed. A
        confirmation email is on its way.
      </p>

      {booking && (
        <div className="mt-8 rounded-2xl border border-divider bg-surface p-6 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Service</dt>
              <dd className="text-offwhite">{booking.serviceTitle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">When</dt>
              <dd className="text-offwhite">
                {formatInTimeZone(
                  new Date(booking.start_at),
                  BUSINESS_TIMEZONE,
                  "EEE, MMM d · h:mm a",
                )}{" "}
                ({BUSINESS_TIMEZONE})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Paid</dt>
              <dd className="font-mono text-gold">
                {formatPrice(booking.amount_cents, booking.currency)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        We&rsquo;ll email your private meeting link before the session. You can
        also view it any time in your dashboard.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/dashboard" size="lg">
          Go to my dashboard
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">
          Back home
        </ButtonLink>
      </div>
      <p className="mt-6 text-xs text-muted">
        Need help?{" "}
        <Link href="/contact" className="text-teal hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
