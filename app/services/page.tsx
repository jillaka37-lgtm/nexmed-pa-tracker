import type { Metadata } from "next";
import { ServiceCard } from "@/components/service-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import {
  HeartPulseIcon,
  SyringeIcon,
  ClipboardCheckIcon,
  ActivityIcon,
  RefillIcon,
  PlaneIcon,
} from "@/components/icons";
import { getActiveServices } from "@/lib/services";
import {
  defaultServices,
  keyMessages,
  pharmacyServices,
  insuranceInfo,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Book a 1:1 health consultation with NexMed. More services and live webinars coming soon.",
};

export default async function ServicesPage() {
  const services = await getActiveServices();
  const highlights = defaultServices[0].highlights;

  return (
    <div>
      <div className="relative overflow-hidden min-h-[240px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/8657290/pexels-photo-8657290.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />
        <div className="relative mx-auto max-w-6xl w-full px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Services</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl text-white">Care that starts with a conversation</h1>
          <p className="mt-4 max-w-xl text-lg text-offwhite/80">Personal consultations, in-pharmacy services, and expert guidance — all in one place.</p>
        </div>
      </div>
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/7659876/pexels-photo-7659876.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/92 via-navy/82 to-navy/70" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Services
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Care that starts with a conversation
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Every NexMed journey begins with a personal consultation. More
          services and live webinars are on the way.
        </p>
      </header>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
          <div className="flex flex-col items-start justify-center rounded-xl border border-dashed border-divider bg-card/40 p-7">
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              Coming soon
            </span>
            <h3 className="mt-4 text-lg font-semibold">Live webinars</h3>
            <p className="mt-2 text-sm text-muted">
              Group sessions and online workshops on the topics that matter most
              to your health.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-surface p-8">
          <h2 className="text-xl font-bold text-white">
            What&rsquo;s included
          </h2>
          <ul className="mt-5 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-offwhite/90">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-5 w-5 shrink-0 fill-health"
                  aria-hidden
                >
                  <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.29 6.3-6.29a1 1 0 011.4 0z" />
                </svg>
                {h}
              </li>
            ))}
          </ul>
          <ButtonLink href="/book" size="lg" className="mt-7 w-full">
            Book a consultation
          </ButtonLink>
        </div>
      </div>

      {/* Pharmacy health services */}
      <section className="mt-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            In-pharmacy services
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Everyday health services, close to home
          </h2>
          <p className="mt-3 text-muted">
            Beyond consultations, our pharmacy team is here for the everyday
            health needs that keep you and your family well.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pharmacyServices.map((s, i) => {
            const Icon = [
              HeartPulseIcon,
              SyringeIcon,
              ClipboardCheckIcon,
              ActivityIcon,
              RefillIcon,
              PlaneIcon,
            ][i % 6];
            return (
              <Reveal
                key={s.title}
                delay={(i % 3) * 90}
                className="rounded-2xl border border-divider bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-xl hover:shadow-teal/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-offwhite">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Insurance & pricing */}
      <section className="mt-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            Insurance &amp; pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Clear, fair pricing, with or without insurance
          </h2>
          <p className="mt-3 text-muted">{insuranceInfo.intro}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {insuranceInfo.points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-divider bg-card/40 p-6"
            >
              <h3 className="text-base font-semibold text-gold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Promise strip */}
      <div className="mt-20 rounded-2xl border border-divider bg-card/40 px-8 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {keyMessages.map((m) => (
            <p key={m} className="text-sm text-muted">
              <span className="mb-2 block h-0.5 w-8 bg-teal" />
              {m}
            </p>
          ))}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
