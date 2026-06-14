"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/app/contact/actions";
import { Button } from "./ui/button";

const initial: ContactState = { ok: false };

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-health/40 bg-health/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-health">Message sent</h3>
        <p className="mt-2 text-sm text-muted">
          Thanks for reaching out. We&rsquo;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-offwhite">
          Name
        </label>
        <input id="name" name="name" required className={fieldClass} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-offwhite">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={fieldClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-offwhite">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={fieldClass}
          placeholder="How can we help?"
        />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
