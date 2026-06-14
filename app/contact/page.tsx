import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { businessInfo } from "@/lib/content";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with NexMed.",
};

export default function ContactPage() {
  return (
    <div>
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/19471015/pexels-photo-19471015.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/92 via-navy/82 to-navy/70" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            Contact
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
            Let&rsquo;s talk
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Have a question before booking? Send a message and we&rsquo;ll get
            back to you. For a full session, you can{" "}
            <a href="/book" className="text-teal hover:underline">
              book a consultation
            </a>{" "}
            any time.
          </p>

          <dl className="mt-10 grid gap-5 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <MailIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="mt-1 text-offwhite">{businessInfo.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="mt-1 text-offwhite">{businessInfo.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-muted">Address</dt>
                <dd className="mt-1 text-offwhite">{businessInfo.address}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-muted">Response time</dt>
                <dd className="mt-1 text-offwhite">Within 1 business day</dd>
              </div>
            </div>
          </dl>

          <div className="mt-8 rounded-2xl border border-divider bg-surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-teal">
              Opening hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {businessInfo.hours.map((h) => (
                <div
                  key={h.day}
                  className="flex justify-between border-b border-divider pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-muted">{h.day}</dt>
                  <dd className="text-offwhite">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-divider bg-surface p-8">
            <ContactForm />
          </div>
          <div className="overflow-hidden rounded-2xl border border-divider">
            <iframe
              title="NexMed location"
              src={businessInfo.mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
