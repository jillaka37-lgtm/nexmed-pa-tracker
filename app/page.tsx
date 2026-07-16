import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { getActiveServices } from "@/lib/services";
import { getProfile } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { InfiniteSlider } from "@/components/infinite-slider";
import {
  TAGLINE,
  USP,
  howItWorks,
  testimonials,
  faqs,
} from "@/lib/content";

const quickActions: {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: ReactNode;
}[] = [
  {
    title: "Book a consultation",
    body: "A private 1:1 session for personal health guidance and a clear plan.",
    href: "/book",
    cta: "Book now",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm12 7H5v10h14V9zm-7 2a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2v-2a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    title: "Refill a prescription",
    body: "Order a refill or transfer a prescription online for pickup or delivery.",
    href: "/refill",
    cta: "Start a refill",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM12 10a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2v-2a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    title: "Shop health products",
    body: "Over-the-counter medicines, vitamins, and everyday health essentials.",
    href: "/shop",
    cta: "Browse the shop",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M7 4h-2a1 1 0 000 2h1.2l1.6 9.6A2 2 0 009.77 17H17a2 2 0 001.96-1.6l1.2-6A1 1 0 0019.18 8H8.2l-.3-1.84A2 2 0 005.93 4.5 2 2 0 005 4.34V4zm2 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
    ),
  },
  {
    title: "Medication information",
    body: "Plain-language guidance on taking medicines safely and storing them right.",
    href: "/medication-info",
    cta: "Learn more",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M10.5 3.5a6 6 0 014.95 9.4l4.83 4.82a1 1 0 01-1.42 1.42l-4.82-4.83A6 6 0 1110.5 3.5zm0 2a4 4 0 100 8 4 4 0 000-8zm0 1.5a1 1 0 011 1v.1a1 1 0 11-2 0V8a1 1 0 011-1zm0 3a1 1 0 011 1v1.5a1 1 0 11-2 0V11a1 1 0 011-1z" />
      </svg>
    ),
  },
];

const stats = [
  { value: "500+", label: "Patients served" },
  { value: "4.9★", label: "Average rating" },
  { value: "30 min", label: "Consultation" },
  { value: "Same day", label: "Pickup available" },
];

export default async function HomePage() {
  const services = await getActiveServices();
  const featured = services[0];
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative min-h-[60vh] overflow-hidden flex items-center">
        {/* Hero background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster="https://images.pexels.com/photos/5342564/pexels-photo-5342564.jpeg?auto=compress&cs=tinysrgb&w=1920"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* Dark + teal gradient overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/80 to-teal/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,168,204,0.15),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/10 via-navy/30 to-navy"
        />

        <div className="relative mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal mb-6 shadow-[0_0_16px_rgba(6,182,212,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              Licensed pharmacists · Online & in-store
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl">
              Healthcare guidance,{" "}
              <span className="text-gradient-teal">made personal again.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted">{USP}</p>

            <p className="mt-4 font-serif text-sm italic text-sky/80">
              &ldquo;{TAGLINE}&rdquo;
            </p>

            {isAdmin && (
              <div className="mt-6">
                <ButtonLink href="/pa-tracker" size="lg" className="shadow-[0_0_24px_rgba(212,175,55,0.35)]">
                  Dashboard
                </ButtonLink>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink href="/book" size="lg">
                Book a consultation
              </ButtonLink>
              <ButtonLink href="#services" variant="outline" size="lg">
                Explore services
              </ButtonLink>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 rounded-full border border-teal/20 bg-surface/60 px-3 py-1 backdrop-blur">
                  <span className="font-mono text-[10px] font-bold text-teal">{s.value}</span>
                  <span className="text-[9px] text-muted">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Infinite slider ─── */}
      <section className="border-b border-divider bg-card/30 py-3">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">
          Everything you need, in one place
        </p>
        <InfiniteSlider />
      </section>


      {/* ─── What you can do ─── */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            Your pharmacy, online
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-gradient-teal">
            Everything you need to stay well
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Refill prescriptions, shop everyday health products, look up medication guidance,
            or talk to an expert, all in one place.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { action: quickActions[1], img: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=700&q=80&auto=format&fit=crop", alt: "Prescription refill" },
            { action: quickActions[2], img: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=700&q=80&auto=format&fit=crop", alt: "Health products shop" },
            { action: quickActions[3], img: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=700&q=80&auto=format&fit=crop", alt: "Medication information" },
          ].map(({ action, img, alt }, i) => (
            <Reveal key={action.title} delay={i * 80}>
              <Link
                href={action.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-divider/60 h-72 hover:border-teal/50 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(6,182,212,0.2)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={alt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/20" />
                <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal/0 via-teal to-teal/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-sky text-navy shadow-[0_0_16px_rgba(6,182,212,0.5)] transition-all duration-300 group-hover:scale-110">
                    {action.icon}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-teal transition-colors duration-200">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted/90 leading-relaxed line-clamp-2">{action.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
                    {action.cta}
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
                      <path d="M3 8a.75.75 0 01.75-.75h6.44L8.22 5.28a.75.75 0 011.06-1.06l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 01-1.06-1.06l1.97-1.97H3.75A.75.75 0 013 8z" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Expert Care + Featured Consultation — combined */}
        <Reveal delay={200} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-teal/20 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
            <div className="flex flex-col lg:flex-row min-h-[100px]">

              {/* Left: single full-height pharmacist photo */}
              <div className="relative lg:w-[12%] shrink-0 min-h-[80px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/19471013/pexels-photo-19471013.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Pharmacist standing in modern pharmacy"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface/90 hidden lg:block" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/80 lg:hidden" />
              </div>

              {/* Right: content */}
              <div className="flex flex-col justify-between gap-1.5 p-2.5 lg:p-3 flex-1 bg-surface">
                {/* Top: expert care text */}
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-teal">Expert care</p>
                  <h3 className="mt-0.5 text-xs font-bold text-white">
                    Real pharmacists, <span className="text-gradient-teal">real guidance</span>
                  </h3>
                  <p className="mt-0.5 text-[10px] text-muted leading-relaxed">
                    Our licensed pharmacists are available online and in-store to answer your questions, review your medications, and help you stay on track with your health goals.
                  </p>
                </div>

                {featured && (
                  <>
                    <div className="h-px bg-gradient-to-r from-teal/30 via-divider to-transparent" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold">
                          <svg viewBox="0 0 16 16" className="h-2 w-2 fill-current" aria-hidden>
                            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                          </svg>
                          Most popular
                        </span>
                        <h3 className="mt-0.5 text-xs font-bold text-white">{featured.title}</h3>
                        <p className="mt-0.5 text-[10px] text-muted">{featured.description}</p>
                      </div>
                      <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end shrink-0">
                        <span className="font-mono text-base font-bold text-gold">
                          {formatPrice(featured.price_cents, featured.currency)}
                        </span>
                        <ButtonLink href={`/book?service=${featured.slug}`} size="sm">
                          Book now
                        </ButtonLink>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </Reveal>
      </section>


      {/* ─── Health categories grid ─── */}
      <section className="border-y border-blue-900/50 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e]/92 via-[#0d1a5e]/88 to-[#0f1f6e]/85" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">Explore our pharmacy</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-white">Browse our health categories</h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100/70">Everything you need, all in one place — from everyday vitamins to prescription support.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: "Vitamins & Supplements", img: "https://images.unsplash.com/photo-1648139346494-2b961c5a2bb7?w=500&q=80&auto=format&fit=crop" },
              { label: "Pain Relief", img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&q=80&auto=format&fit=crop" },
              { label: "Skincare", img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80&auto=format&fit=crop" },
              { label: "Cold & Flu", img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80&auto=format&fit=crop" },
              { label: "Heart Health", img: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=500&q=80&auto=format&fit=crop" },
              { label: "Diabetes Care", img: "https://images.pexels.com/photos/6940852/pexels-photo-6940852.jpeg?auto=compress&cs=tinysrgb&w=500" },
              { label: "Mental Wellness", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80&auto=format&fit=crop" },
              { label: "Baby & Child", img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80&auto=format&fit=crop" },
            ].map(({ label, img }, i) => (
              <Reveal key={label} delay={i * 60}>
                <Link
                  href={`/shop?cat=${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="group relative flex h-28 overflow-hidden rounded-2xl border border-divider/60 hover:border-teal/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(6,182,212,0.2)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/50 to-navy/10" />
                  <div aria-hidden className="absolute inset-0 bg-teal/0 group-hover:bg-teal/10 transition-colors duration-300" />
                  <span className="absolute bottom-0 left-0 right-0 p-3 text-sm font-semibold text-white group-hover:text-teal transition-colors duration-200">{label}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* ─── How it works ─── */}

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-gradient-teal">
            Booked in three simple steps
          </h2>
        </Reveal>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector arrow line (desktop only) */}
          <div aria-hidden className="absolute left-[33%] right-[33%] top-[120px] hidden h-px bg-gradient-to-r from-teal/40 via-sky/60 to-teal/40 md:block" />

          {[
            {
              step: howItWorks[0],
              image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80&auto=format&fit=crop",
              alt: "Person signing up on laptop",
              icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              ),
            },
            {
              step: howItWorks[1],
              image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80&auto=format&fit=crop",
              alt: "Scheduling a time slot",
              icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                  <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm12 7H5v10h14V9z"/>
                </svg>
              ),
            },
            {
              step: howItWorks[2],
              image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80&auto=format&fit=crop",
              alt: "Doctor consultation meeting",
              icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              ),
            },
          ].map(({ step, image, alt, icon }, i) => (
            <Reveal key={step.step} delay={i * 120}>
              <div className="group relative overflow-hidden rounded-2xl border border-divider bg-surface transition-all duration-300 hover:-translate-y-2 hover:border-teal/50 hover:shadow-[0_8px_40px_rgba(6,182,212,0.18)]">
                {/* Photo */}
                <div className="relative h-32 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                  {/* Step number overlaid on photo */}
                  <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal to-sky shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                    <span className="font-mono text-base font-black text-navy">{step.step}</span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-6">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 text-teal">
                    {icon}
                  </div>
                  <h3 className="text-lg font-bold text-offwhite group-hover:text-teal transition-colors duration-200">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>


      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="relative py-3 overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1612851300081-30cac0077b3b?w=1920&q=80&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/88 to-teal/10" />

        {/* Edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-navy to-transparent z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-navy to-transparent z-10" />

        <div className="relative">
          {/* Heading */}
          <div className="text-center mb-8 px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">Testimonials</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-gradient-teal">
              Trusted by patients &amp; caregivers
            </h2>
          </div>

          {/* Row 1 — scrolls left */}
          {(() => {
            const row1 = [
              ...testimonials,
              { name: "Emily K.", role: "New patient", rating: 5, content: "I was nervous about my first consultation but felt so at ease. The pharmacist was warm, patient, and incredibly knowledgeable." },
              { name: "James T.", role: "Regular customer", rating: 5, content: "Refilling prescriptions has never been easier. Everything online, no waiting in line — this is how it should always be." },
              { name: "Linda C.", role: "Senior patient", rating: 5, content: "They took the time to explain every medication clearly. I finally feel in control of my own health." },
            ];
            return (
              <div className="flex overflow-hidden mb-4">
                <div className="flex gap-4 shrink-0" style={{ animation: "marquee 35s linear infinite" }}>
                  {[...row1, ...row1].map((t, i) => (
                    <div key={i} className="w-64 shrink-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg">
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <svg key={si} viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${si < t.rating ? "fill-gold" : "fill-white/20"}`} aria-hidden><path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z"/></svg>
                        ))}
                      </div>
                      <blockquote className="font-serif text-sm italic leading-relaxed text-white/90">
                        &ldquo;{t.content}&rdquo;
                      </blockquote>
                      <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-sky text-xs font-bold text-navy">
                          {t.name.split(" ").map((p: string) => p[0]).join("").toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{t.name}</p>
                          <p className="text-xs text-teal/80">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-divider bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-gradient-teal">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* Left: image + trust badges */}
            <Reveal className="lg:w-2/5 shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-teal/20 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1580281657527-47f249e8f4df?w=700&q=80&auto=format&fit=crop"
                  alt="Pharmacy interior"
                  className="h-96 w-full object-cover lg:h-[500px]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-lg font-bold text-white">Still have questions?</p>
                  <p className="mt-1 text-sm text-muted">Our pharmacists are here to help you every step of the way.</p>
                  <Link href="/contact" className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal/20 border border-teal/40 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/30 transition-colors">
                    Contact us
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden><path d="M3 8a.75.75 0 01.75-.75h6.44L8.22 5.28a.75.75 0 011.06-1.06l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 01-1.06-1.06l1.97-1.97H3.75A.75.75 0 013 8z"/></svg>
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Right: FAQ cards */}
            <div className="flex-1 grid gap-3">
              {faqs.map((item, i) => (
                <Reveal key={item.q} delay={i * 60}>
                  <div className="flex flex-col gap-2 rounded-2xl border border-divider/60 bg-surface p-5 hover:border-teal/40 hover:shadow-[0_4px_24px_rgba(6,182,212,0.1)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal border border-teal/30">
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-offwhite leading-snug">{item.q}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted pl-9">{item.a}</p>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </section>

    </>
  );
}
