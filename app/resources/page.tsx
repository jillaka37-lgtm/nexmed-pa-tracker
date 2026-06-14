import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { articles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Health resources",
  description:
    "Practical health tips, guides, and wellness articles from NexMed.",
};

export default function ResourcesPage() {
  return (
    <div>
      <div className="relative overflow-hidden min-h-[240px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.pexels.com/photos/12512668/pexels-photo-12512668.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />
        <div className="relative mx-auto max-w-6xl w-full px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Resources</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl text-white">Health tips &amp; guides</h1>
          <p className="mt-4 max-w-xl text-lg text-offwhite/80">Practical, easy-to-read advice to help you stay informed between consultations.</p>
        </div>
      </div>
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/2284168/pexels-photo-2284168.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/92 via-navy/82 to-navy/70" />
    <div className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Resources
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Health tips &amp; guides
        </h1>
        <p className="mt-4 text-lg text-muted">
          Practical, easy-to-read advice to help you stay informed between
          consultations. New articles are added regularly.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a, i) => (
          <Reveal
            key={a.slug}
            delay={(i % 3) * 90}
            className="group flex flex-col overflow-hidden rounded-2xl border border-divider bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-xl hover:shadow-teal/5"
          >
            <span className="h-1 w-full bg-gradient-to-r from-teal via-sky to-health" />
            <div className="flex flex-1 flex-col p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-sky">
                {a.category}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-offwhite transition-colors group-hover:text-teal">
                {a.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted">{a.excerpt}</p>
              <p className="mt-4 text-xs text-muted">
                {a.readMinutes} min read
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-divider bg-surface px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-white">
          Have a question that needs a real answer?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Articles are a great start, but nothing beats personal guidance. Book
          a 1:1 consultation for advice tailored to you.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/book" size="lg">
            Book a consultation
          </ButtonLink>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
