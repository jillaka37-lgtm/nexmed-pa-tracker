import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Booking cancelled" };

export default async function BookingCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking } = await searchParams;

  // Release the held slot immediately rather than waiting for the pending
  // expiry window. Only a still-unpaid hold is touched.
  if (booking && hasSupabaseEnv) {
    try {
      const admin = createAdminClient();
      await admin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking)
        .eq("status", "pending_payment");
    } catch {
      // best-effort; the pending hold expires on its own anyway
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
        <svg viewBox="0 0 24 24" className="h-9 w-9 fill-gold" aria-hidden>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold">Payment cancelled</h1>
      <p className="mt-3 text-muted">
        No charge was made and the time slot has been released. You can pick
        another time whenever you&rsquo;re ready.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/book" size="lg">
          Choose another time
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">
          Back home
        </ButtonLink>
      </div>
      <p className="mt-6 text-xs text-muted">
        Ran into a problem?{" "}
        <Link href="/contact" className="text-teal hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
