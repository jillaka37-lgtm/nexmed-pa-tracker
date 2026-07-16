import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "AuthDraft — Prior Auth Letters, Drafted in Seconds" };

const BENEFITS = [
  {
    title: "Hours back in your day",
    body: "Stop rewriting the same medical necessity paragraph for every case. What used to take 20 minutes of writing takes one form and a few seconds.",
  },
  {
    title: "Stronger, more consistent letters",
    body: "Every draft follows the same clear structure — medical necessity, prior treatment history, and a flag for anything missing before it goes out.",
  },
  {
    title: "Nothing invented, nothing hidden",
    body: "The AI never guesses a lab value or a date it wasn't given — it tells you what's missing instead, so you catch gaps before the insurer does.",
  },
];

const STEPS = [
  { title: "Enter the case", body: "Diagnosis, medication, insurer, and what's already been tried — no patient name needed." },
  { title: "Get a draft", body: "A structured, ready-to-review letter appears in seconds, with any missing info flagged." },
  { title: "Review and send", body: "You always review before it goes anywhere — this drafts the letter, it doesn't submit it." },
];

export default function PriorAuthAboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          For NexMed pharmacy staff
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-offwhite sm:text-5xl">
          Prior authorization paperwork is eating your week
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          AuthDraft turns a case summary into a ready-to-review prior
          authorization letter in seconds — so you spend less time writing
          and more time with patients.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login?redirect=/prior-auth">
            <Button size="lg">Start drafting</Button>
          </Link>
          <Link href="/prior-auth/sample">
            <Button variant="outline" size="lg">
              See a sample draft
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-divider bg-card p-6">
            <h3 className="font-semibold text-offwhite">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-center font-serif text-2xl font-bold text-offwhite">
          How it works
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-divider bg-card p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/15 text-sm font-bold text-teal">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold text-offwhite">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-16 text-center">
        <Link href="/login?redirect=/prior-auth">
          <Button size="lg">Start drafting — it&rsquo;s free for NexMed staff</Button>
        </Link>
      </div>
    </div>
  );
}
