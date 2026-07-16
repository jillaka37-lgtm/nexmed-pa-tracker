import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { MedicationSearch } from "@/components/medication-search";
import { medicationSafety, medicationCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Medication information",
  description:
    "Plain-language guidance on common medication types and how to take, store, and handle medicines safely. Educational information from NexMed.",
};

export default function MedicationInfoPage() {
  return (
    <div>
      <div className="relative overflow-hidden min-h-[240px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/16051964/pexels-photo-16051964.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />
        <div className="relative mx-auto max-w-6xl w-full px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Medication information</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl text-white">Understanding your medicines</h1>
          <p className="mt-4 max-w-xl text-lg text-offwhite/80">Plain-language guidance on common medication types and how to use them safely.</p>
        </div>
      </div>
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/3873141/pexels-photo-3873141.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/80 to-navy/70" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Medication information
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Understanding your medicines
        </h1>
        <p className="mt-4 text-lg text-muted">
          General, easy-to-read guidance on common medication types and how to
          use them safely. Have a specific question? Our pharmacists are happy to
          help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/refill" size="md">
            Refill a prescription
          </ButtonLink>
          <ButtonLink href="/book" size="md" variant="outline">
            Ask a pharmacist
          </ButtonLink>
        </div>
      </header>

      {/* Medication search */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Look up a medication</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Search a medication by name or brand to see what it&rsquo;s used for, typical dosage, side effects, and warnings.
        </p>
        <div className="mt-6">
          <MedicationSearch />
        </div>
      </section>

      {/* Safety basics */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Medication safety basics</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {medicationSafety.map((s, i) => (
            <Reveal
              key={s.title}
              delay={(i % 3) * 90}
              className="rounded-2xl border border-divider bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-health/40 hover:shadow-xl hover:shadow-health/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-health/10 text-health">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-current"
                  aria-hidden
                >
                  <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1 13.4l5-5L14.6 9 11 12.6 9.4 11 8 12.4l3 3z" />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-offwhite">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Common categories */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold">Common medication types</h2>
        <p className="mt-2 max-w-2xl text-muted">
          A quick overview of the over-the-counter products you&rsquo;ll find in
          our shop, and what they&rsquo;re typically used for.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {medicationCategories.map((c, i) => (
            <Reveal
              key={c.category}
              delay={(i % 2) * 90}
              className="rounded-2xl border border-divider bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-xl hover:shadow-teal/5"
            >
              <h3 className="text-lg font-semibold text-offwhite">
                {c.category}
              </h3>
              <p className="mt-2 text-sm text-muted">{c.body}</p>
              <p className="mt-4 text-xs text-muted">
                <span className="font-semibold text-sky">Examples: </span>
                {c.examples}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mt-16 rounded-2xl border border-divider bg-card/40 p-6 text-center text-sm text-muted">
        This information is for general education only and is not a substitute
        for professional medical advice. Always read the patient information
        leaflet and speak with a pharmacist or doctor about your specific
        situation. In an emergency, call your local emergency number.
      </p>
    </div>
    </div>
    </div>
  );
}
