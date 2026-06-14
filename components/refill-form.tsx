"use client";

import { useActionState, useState } from "react";
import { submitRefill, type RefillState } from "@/app/refill/actions";
import { Button } from "./ui/button";

const initial: RefillState = { ok: false };

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-offwhite";

export function RefillForm() {
  const [state, formAction, pending] = useActionState(submitRefill, initial);
  const [fulfilment, setFulfilment] = useState("pickup");

  if (state.ok) {
    return (
      <div className="rounded-xl border border-health/40 bg-health/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-health">Request received</h3>
        <p className="mt-2 text-sm text-muted">
          Thanks. Our pharmacy team will review your refill and contact you
          shortly to confirm the details, pricing, and pickup or delivery.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className={fieldClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="date_of_birth" className={labelClass}>
            Date of birth
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
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
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            required
            className={fieldClass}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="medication_name" className={labelClass}>
            Medication name
          </label>
          <input
            id="medication_name"
            name="medication_name"
            required
            className={fieldClass}
            placeholder="e.g. Atorvastatin"
          />
        </div>
        <div>
          <label htmlFor="dosage" className={labelClass}>
            Dosage / strength
          </label>
          <input
            id="dosage"
            name="dosage"
            className={fieldClass}
            placeholder="e.g. 20 mg, once daily"
          />
        </div>
        <div>
          <label htmlFor="prescription_number" className={labelClass}>
            Prescription number{" "}
            <span className="text-muted">(optional)</span>
          </label>
          <input
            id="prescription_number"
            name="prescription_number"
            className={fieldClass}
            placeholder="From your label"
          />
        </div>
        <div>
          <label htmlFor="current_pharmacy" className={labelClass}>
            Current pharmacy{" "}
            <span className="text-muted">(for transfers)</span>
          </label>
          <input
            id="current_pharmacy"
            name="current_pharmacy"
            className={fieldClass}
            placeholder="Where it's filled now"
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>How would you like to receive it?</legend>
        <div className="mt-1 flex gap-3">
          {[
            { value: "pickup", label: "Pickup" },
            { value: "delivery", label: "Delivery" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                fulfilment === opt.value
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-divider text-muted hover:border-teal/50"
              }`}
            >
              <input
                type="radio"
                name="fulfilment"
                value={opt.value}
                checked={fulfilment === opt.value}
                onChange={(e) => setFulfilment(e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {fulfilment === "delivery" && (
        <div>
          <label htmlFor="delivery_address" className={labelClass}>
            Delivery address
          </label>
          <textarea
            id="delivery_address"
            name="delivery_address"
            rows={2}
            className={fieldClass}
            placeholder="Street, city, ZIP"
          />
        </div>
      )}

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={fieldClass}
          placeholder="Anything our pharmacist should know (allergies, urgency, etc.)"
        />
      </div>

      {state.error && <p className="text-sm text-gold">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Submitting…" : "Submit refill request"}
      </Button>
      <p className="text-center text-xs text-muted">
        This is a request only. No payment is taken now. Our team confirms
        availability and pricing before filling.
      </p>
    </form>
  );
}
