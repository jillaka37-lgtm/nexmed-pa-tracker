import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { coreValues } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the team behind NexMed. Compassionate, expert human care for everyday health and wellbeing.",
};

export default function AboutPage() {
  return (
    <div>
      <div className="relative overflow-hidden h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/8657293/pexels-photo-8657293.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy/50 via-navy/70 to-navy" />
      </div>
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-divider bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="NexMed pharmacist"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            About
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
            Making healthcare personal again
          </h1>

          <div className="mt-6 space-y-4 font-serif text-base leading-relaxed text-offwhite/90">
            <p>Welcome to NexMed. I started this because I believe healthcare should feel personal again. Too often people leave feeling rushed, unheard, or like just another file in the system. I wanted to build something different.</p>
            <p>Here you get honest guidance, real answers, and someone who actually listens. Whether you&rsquo;re managing a health concern or just trying to feel like yourself again, I&rsquo;m here to help and you&rsquo;ll always be treated like a person, not a number.</p>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {coreValues.map((v) => (
              <div
                key={v.title}
                className="rounded-lg border border-divider bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-teal/10 text-xs font-bold text-teal">
                    {v.letter}
                  </span>
                  <h3 className="text-sm font-semibold">{v.title}</h3>
                </div>
                <p className="mt-1 text-xs text-muted">{v.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/book" size="lg">
              Book a consultation
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline">
              Get in touch
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
