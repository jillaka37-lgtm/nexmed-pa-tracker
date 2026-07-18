"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string }; // eslint-disable-line @typescript-eslint/no-unused-vars

export function MobileMenu({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  links: _links,
  isLoggedIn,
  isAdmin,
}: {
  links: NavLink[];
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) setOpen(false);
  }, [pathname, open]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-divider text-muted transition-colors hover:border-teal hover:text-teal"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth={2} fill="none" aria-hidden>
          {open ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
          )}
        </svg>
      </button>

      {/* Full-screen overlay */}
      <div
        className={`fixed inset-0 z-50 bg-navy transition-all duration-300 ease-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-8 border-b border-divider">
          <span className="text-sm font-bold text-offwhite tracking-wide">NexMed</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-divider text-muted hover:border-teal hover:text-teal"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth={2} fill="none" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Menu body */}
        <div className="overflow-y-auto h-[calc(100vh-4rem)] px-8 py-10 flex flex-col gap-10 md:flex-row md:gap-0">

          {/* Branding */}
          <div className="md:w-1/3 md:pr-12 md:border-r md:border-divider">
            <p className="text-3xl font-bold text-offwhite">NexMed</p>
            <p className="mt-3 text-sm leading-relaxed text-muted max-w-xs">
              Compassionate, expert pharmacy and health care. Consultations, refills, and everyday health products.
            </p>
            <p className="mt-4 font-serif text-sm italic text-teal">&ldquo;Your Health, Our Mission.&rdquo;</p>
          </div>

          {/* Sections */}
          <div className="md:flex-1 md:pl-12 grid grid-cols-1 gap-10 sm:grid-cols-3">

          {/* EXPLORE */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-teal">Explore</p>
            <ul className="space-y-1">
              {[
                { href: "/pa-tracker", label: "Dashboard" },
                { href: "/shop", label: "Shop" },
                { href: "/refill", label: "Refill prescription" },
                { href: "/medication-info", label: "Medication info" },
                { href: "/services", label: "Consultations" },
                { href: "/resources", label: "Resources" },
                { href: "/contact#about", label: "About" },
                { href: "/#faq", label: "FAQ" },
                { href: "/book", label: "Book a consultation" },
                { href: "/contact", label: "Contact" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ACCOUNT */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-teal">Account</p>
            <ul className="space-y-1">
              {isLoggedIn ? (
                <>
                  {isAdmin && (
                    <>
                      <li>
                        <Link href="/crm" className="block py-2.5 text-base font-medium text-gold border-b border-divider/40 hover:text-teal transition-colors">
                          CRM
                        </Link>
                      </li>
                      <li>
                        <Link href="/admin/messages" className="block py-2.5 text-base font-medium text-gold border-b border-divider/40 hover:text-teal transition-colors">
                          Messages
                        </Link>
                      </li>
                      <li>
                        <Link href="/admin" className="block py-2.5 text-base font-medium text-gold border-b border-divider/40 hover:text-teal transition-colors">
                          Admin panel
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <Link href="/dashboard" className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors">
                      My bookings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors">
                      Create account
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors">
                      My bookings
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CONNECT */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-teal">Connect</p>
            <ul className="space-y-1">
              {[
                { href: "https://instagram.com", label: "Instagram" },
                { href: "https://linkedin.com", label: "LinkedIn" },
                { href: "https://x.com", label: "X" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2.5 text-base font-medium text-offwhite/80 border-b border-divider/40 hover:text-teal transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          </div>{/* end sections grid */}
        </div>{/* end menu body */}
      </div>{/* end overlay */}
    </>
  );
}
