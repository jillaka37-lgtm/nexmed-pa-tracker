"use client";

import { useState } from "react";
import Link from "next/link";
import { businessInfo } from "@/lib/content";

export function QuickContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-2xl border border-divider bg-card p-5 shadow-xl">
          <p className="text-sm font-semibold text-offwhite">
            Ask a pharmacist
          </p>
          <p className="mt-1 text-xs text-muted">
            We&rsquo;re here to help with medicines, orders, and health
            questions.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a
              href={`tel:${businessInfo.phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-3 rounded-lg border border-divider px-3 py-2 text-offwhite transition-colors hover:border-teal hover:text-teal"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.56 3.5 1 1 0 01-.24 1l-2.2 2.3z" />
              </svg>
              {businessInfo.phone}
            </a>
            <a
              href={`mailto:${businessInfo.email}`}
              className="flex items-center gap-3 rounded-lg border border-divider px-3 py-2 text-offwhite transition-colors hover:border-teal hover:text-teal"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v.5l8 5 8-5V6H4zm16 2.8l-7.4 4.6a1 1 0 01-1.2 0L4 8.8V18h16V8.8z" />
              </svg>
              {businessInfo.email}
            </a>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-divider px-3 py-2 text-offwhite transition-colors hover:border-teal hover:text-teal"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z" />
              </svg>
              Send us a message
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Ask a pharmacist"}
        className="flex items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-semibold text-navy shadow-lg transition-colors hover:bg-sky"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
            <path d="M18.3 5.7a1 1 0 010 1.4L13.4 12l4.9 4.9a1 1 0 01-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 01-1.4-1.4l4.9-4.9-4.9-4.9a1 1 0 011.4-1.4l4.9 4.9 4.9-4.9a1 1 0 011.4 0z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
            <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z" />
          </svg>
        )}
        {open ? "Close" : "Ask a pharmacist"}
      </button>
    </div>
  );
}
