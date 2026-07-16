"use client";

import { useMemo, useState } from "react";
import { medications, type Medication } from "@/lib/medications";

function matches(med: Medication, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return (
    med.name.toLowerCase().includes(q) ||
    med.aliases.some((a) => a.toLowerCase().includes(q)) ||
    med.category.toLowerCase().includes(q)
  );
}

function MedicationCard({ med }: { med: Medication }) {
  return (
    <div className="rounded-2xl border border-divider bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-offwhite">{med.name}</h3>
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">{med.category}</span>
      </div>
      {med.aliases.length > 0 && (
        <p className="mt-1 text-xs text-muted">Also known as: {med.aliases.join(", ")}</p>
      )}

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-semibold text-sky">Used for</dt>
          <dd className="mt-0.5 text-muted">{med.uses}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sky">Typical dosage</dt>
          <dd className="mt-0.5 text-muted">{med.typicalDosage}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sky">Common side effects</dt>
          <dd className="mt-0.5 text-muted">{med.sideEffects}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gold">Warnings</dt>
          <dd className="mt-0.5 text-muted">{med.warnings}</dd>
        </div>
      </dl>
    </div>
  );
}

export function MedicationSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => medications.filter((m) => matches(m, query)), [query]);
  const isSearching = query.trim().length > 0;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-muted"
          strokeWidth={2}
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a medication by name (e.g. Ibuprofen, Tylenol, Metformin)…"
          className="w-full rounded-xl border border-divider bg-navy py-3.5 pl-12 pr-4 text-base text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {isSearching && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="rounded-xl border border-divider bg-card/40 p-5 text-sm text-muted">
              No match in our reference list for &ldquo;{query}&rdquo;. Ask a pharmacist, or{" "}
              <a href="/contact" className="text-teal hover:underline">contact us</a> for help.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {results.map((med) => (
                <MedicationCard key={med.name} med={med} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
