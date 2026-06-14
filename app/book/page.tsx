import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking-flow";
import { getActiveServices } from "@/lib/services";
import { getBookableWeekdays } from "@/lib/availability";
import { getUser } from "@/lib/auth";
import { BUSINESS_TIMEZONE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Choose a time and book your NexMed consultation.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: requestedSlug } = await searchParams;
  const services = await getActiveServices();
  if (services.length === 0) notFound();

  const selected =
    services.find((s) => s.slug === requestedSlug) ?? services[0];

  const [weekdays, user] = await Promise.all([
    getBookableWeekdays(),
    getUser(),
  ]);

  return (
    <div>
      <div className="relative overflow-hidden min-h-[220px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/14797864/pexels-photo-14797864.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />
        <div className="relative mx-auto max-w-5xl w-full px-6 py-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Book</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Reserve your consultation</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-offwhite/80">Pick a time that works for you — confirmed the moment your payment goes through.</p>
        </div>
      </div>
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Book
        </p>
        <h1 className="mt-2 text-4xl font-bold">Reserve your consultation</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Pick a time that works for you. Your slot is confirmed the moment your
          payment goes through.
        </p>
      </header>

      <div className="mt-10">
        <BookingFlow
          services={services}
          initialServiceSlug={selected.slug}
          bookableWeekdays={Array.from(weekdays)}
          timezone={BUSINESS_TIMEZONE}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </div>
    </div>
  );
}
