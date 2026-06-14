"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { fetchSlots, startCheckout } from "@/app/book/actions";
import { Button } from "./ui/button";
import { formatPrice } from "@/lib/format";
import { BOOKING_WINDOW_DAYS } from "@/lib/config";
import type { Service } from "@/lib/services";
import type { Slot } from "@/lib/slots";

type Props = {
  services: Service[];
  initialServiceSlug: string;
  bookableWeekdays: number[];
  timezone: string;
  isAuthenticated: boolean;
};

function buildDates(timezone: string) {
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      iso: formatInTimeZone(d, timezone, "yyyy-MM-dd"),
      weekday: Number(formatInTimeZone(d, timezone, "i")) % 7, // 1..7 -> 0..6 (Sun=0)
      dow: formatInTimeZone(d, timezone, "EEE"),
      day: formatInTimeZone(d, timezone, "d"),
      month: formatInTimeZone(d, timezone, "MMM"),
    };
  });
}

export function BookingFlow({
  services,
  initialServiceSlug,
  bookableWeekdays,
  timezone,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug);
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dates = buildDates(timezone);
  const bookable = new Set(bookableWeekdays);
  const service = services.find((s) => s.slug === serviceSlug) ?? services[0];

  useEffect(() => {
    if (!dateStr) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset + load slots when the chosen date/service changes
    setLoadingSlots(true);
    setSlot(null);
    fetchSlots(serviceSlug, dateStr)
      .then((next) => {
        if (active) setSlots(next);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [dateStr, serviceSlug]);

  function handlePay() {
    if (!slot) return;
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(serviceSlug, slot.startISO);
      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="space-y-8">
        {/* Service selector (only if more than one) */}
        {services.length > 1 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal">
              1 · Choose a service
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setServiceSlug(s.slug);
                    setSlot(null);
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    s.slug === serviceSlug
                      ? "border-teal bg-teal/10"
                      : "border-divider bg-surface hover:border-teal/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-offwhite">
                      {s.title}
                    </span>
                    <span className="font-mono text-sm text-gold">
                      {formatPrice(s.price_cents, s.currency)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{s.duration_min} min</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Date picker */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal">
            {services.length > 1 ? "2" : "1"} · Pick a date
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const enabled = bookable.has(d.weekday);
              const active = d.iso === dateStr;
              return (
                <button
                  key={d.iso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setDateStr(d.iso)}
                  className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2.5 transition-colors ${
                    active
                      ? "border-teal bg-teal/10 text-teal"
                      : enabled
                        ? "border-divider bg-surface text-offwhite hover:border-teal/50"
                        : "cursor-not-allowed border-divider/40 bg-card text-muted/40"
                  }`}
                >
                  <span className="text-[11px] uppercase">{d.dow}</span>
                  <span className="text-lg font-bold leading-tight">{d.day}</span>
                  <span className="text-[11px] uppercase">{d.month}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time slots */}
        {dateStr && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal">
              {services.length > 1 ? "3" : "2"} · Choose a time
              <span className="ml-2 font-normal normal-case text-muted">
                ({timezone})
              </span>
            </h2>
            {loadingSlots ? (
              <p className="text-sm text-muted">Loading available times…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-lg border border-divider bg-surface p-4 text-sm text-muted">
                No open times on this day. Try another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.startISO}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      slot?.startISO === s.startISO
                        ? "border-teal bg-teal text-navy"
                        : "border-divider bg-surface text-offwhite hover:border-teal"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Summary / pay */}
      <aside className="rounded-2xl border border-divider bg-surface p-6 lg:sticky lg:top-24">
        <h3 className="text-lg font-semibold">{service.title}</h3>
        <p className="mt-1 text-sm text-muted">{service.duration_min} minutes</p>

        <dl className="mt-5 space-y-2 border-t border-divider pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Date</dt>
            <dd className="text-offwhite">
              {dateStr
                ? formatInTimeZone(
                    new Date(`${dateStr}T12:00:00Z`),
                    "UTC",
                    "EEE, MMM d",
                  )
                : "Not selected"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Time</dt>
            <dd className="text-offwhite">{slot ? slot.label : "Not selected"}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="font-mono text-gold">
              {formatPrice(service.price_cents, service.currency)}
            </dd>
          </div>
        </dl>

        {error && <p className="mt-4 text-sm text-gold">{error}</p>}

        <Button
          size="lg"
          className="mt-6 w-full"
          disabled={!slot || pending}
          onClick={handlePay}
        >
          {pending
            ? "Redirecting…"
            : isAuthenticated
              ? "Book & pay"
              : "Sign in to book"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          Secure payment via Stripe. Your slot is held while you check out.
        </p>
      </aside>
    </div>
  );
}
