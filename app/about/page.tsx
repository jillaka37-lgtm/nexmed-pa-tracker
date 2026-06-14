import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ELEVATOR_PITCH, coreValues } from "@/lib/content";

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
        {/* Photo placeholder — replace with a real headshot at /public/about.jpg */}
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-divider bg-surface">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <svg
                viewBox="0 0 24 24"
                className="h-16 w-16 fill-divider"
                aria-hidden
              >
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />
              </svg>
              <p className="px-6 text-xs text-muted">
                Your photo goes here. Drop a headshot at{" "}
                <code className="font-mono text-sky">/public/about.jpg</code>
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">
            About
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
            Making healthcare personal again
          </h1>

          {/* Bio placeholder — replace with your real story. */}
          <div className="mt-6 space-y-4 font-serif text-base leading-relaxed text-offwhite/90">
            <p>{ELEVATOR_PITCH}</p>
            <p>
              <span className="rounded bg-gold/10 px-1.5 py-0.5 text-sm not-italic text-gold">
                Placeholder
              </span>{" "}
              This is where your personal story will live. Tell visitors who you
              are, your background, the people you help, and
              why you started NexMed. Send me your bio and headshot and I&rsquo;ll
              drop them straight in.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {coreValues.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-divider bg-surface p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-sm font-bold text-teal">
                    {v.letter}
                  </span>
                  <h3 className="text-base font-semibold">{v.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted">{v.body}</p>
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
