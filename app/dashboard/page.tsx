import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { ButtonLink } from "@/components/ui/button";
import { getUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/config";

export const metadata: Metadata = { title: "My dashboard" };

type DashboardBooking = {
  id: string;
  start_at: string;
  status: string;
  amount_cents: number;
  currency: string;
  meeting_link: string | null;
  services: { title: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-health/15 text-health",
  pending_payment: "bg-gold/15 text-gold",
  completed: "bg-sky/15 text-sky",
  cancelled: "bg-divider text-muted",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  pending_payment: "Awaiting payment",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function DashboardPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/dashboard");

  const user = await getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const profile = await getProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, start_at, status, amount_cents, currency, meeting_link, services(title)",
    )
    .eq("user_id", user.id)
    .order("start_at", { ascending: false });

  const bookings = (data ?? []) as unknown as DashboardBooking[];
  const greeting = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {greeting}</h1>
          <p className="mt-2 text-muted">
            Your consultations and meeting links live here.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-muted transition-colors hover:text-teal"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-surface p-10 text-center">
            <p className="text-muted">You don&rsquo;t have any bookings yet.</p>
            <ButtonLink href="/book" size="lg" className="mt-6">
              Book a consultation
            </ButtonLink>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-divider bg-surface p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-offwhite">
                    {b.services?.title ?? "Consultation"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatInTimeZone(
                      new Date(b.start_at),
                      BUSINESS_TIMEZONE,
                      "EEE, MMM d · h:mm a",
                    )}{" "}
                    ({BUSINESS_TIMEZONE})
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_STYLES[b.status] ?? "bg-divider text-muted"
                  }`}
                >
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4 text-sm">
                <span className="font-mono text-gold">
                  {formatPrice(b.amount_cents, b.currency)}
                </span>
                {b.status === "confirmed" &&
                  (b.meeting_link ? (
                    <ButtonLink
                      href={b.meeting_link}
                      size="sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join meeting
                    </ButtonLink>
                  ) : (
                    <span className="text-muted">
                      Meeting link coming by email
                    </span>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
