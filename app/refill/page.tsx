import type { Metadata } from "next";
import { RefillForm } from "@/components/refill-form";

export const metadata: Metadata = {
  title: "Refill a prescription",
  description:
    "Request a prescription refill online with NexMed for pickup or delivery. Our pharmacy team reviews every request and follows up.",
};

const steps = [
  {
    step: "01",
    title: "Send your details",
    body: "Tell us the medication and how you'd like to receive it. Takes about a minute.",
  },
  {
    step: "02",
    title: "We review it",
    body: "Our pharmacist checks availability and pricing, and confirms anything we need.",
  },
  {
    step: "03",
    title: "Pickup or delivery",
    body: "We let you know when it's ready to collect or on its way to your door.",
  },
];

export default function RefillPage() {
  return (
    <div>
      <div className="relative overflow-hidden min-h-[240px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/8657359/pexels-photo-8657359.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />
        <div className="relative mx-auto max-w-6xl w-full px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Pharmacy</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl text-white">Refill a prescription online</h1>
          <p className="mt-4 max-w-xl text-lg text-offwhite/80">Order a refill or transfer a prescription in a few clicks. Our pharmacy team takes care of the rest.</p>
        </div>
      </div>
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/9155927/pexels-photo-9155927.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/96 via-navy/92 to-navy/85" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Pharmacy
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Refill a prescription online
        </h1>
        <p className="mt-4 text-lg text-muted">
          Order a refill or transfer a prescription in a few clicks. Submit your
          request and our pharmacy team takes care of the rest. Choose pickup or
          delivery.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="rounded-2xl border border-divider bg-surface p-8">
          <RefillForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-teal">
            How it works
          </h2>
          {steps.map((s) => (
            <div
              key={s.step}
              className="rounded-xl border border-divider bg-surface p-6"
            >
              <span className="font-mono text-2xl font-bold text-teal/40">
                {s.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
          <p className="rounded-xl border border-divider bg-card/40 p-5 text-xs text-muted">
            For a new prescription or health advice, you can also{" "}
            <a href="/book" className="text-teal hover:underline">
              book a consultation
            </a>
            . In an emergency, call your local emergency number.
          </p>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
