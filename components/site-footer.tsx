import Link from "next/link";
import { Logo } from "./logo";
import { Sparkles } from "./sparkles";
import { ShaderBanner } from "./shader-banner";

const footerNav = [
  {
    title: "Explore",
    links: [
      { href: "/shop", label: "Shop" },
      { href: "/refill", label: "Refill prescription" },
      { href: "/medication-info", label: "Medication info" },
      { href: "/services", label: "Consultations" },
      { href: "/resources", label: "Resources" },
      { href: "/about", label: "About" },
      { href: "/#faq", label: "FAQ" },
      { href: "/book", label: "Book a consultation" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
      { href: "/dashboard", label: "My bookings" },
    ],
  },
];

const socials = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://twitter.com", label: "X" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-divider bg-card">
      {/* Footer banner */}
      <div className="bg-teal/20 border-y border-teal/40 flex items-center">
        <div className="mx-auto max-w-6xl w-full px-6 py-4 text-center">
          <p className="text-sm font-semibold text-navy">
            One pharmacy <span className="text-teal font-bold">for every health need.</span>
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.8fr_1fr_1fr_1.4fr]">

        {/* Brand column */}
        <div className="space-y-4">
          <Logo />
          {/* Pharmacy image */}
          <div className="relative overflow-hidden rounded-xl border border-teal/20 h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1580281657529-557a6abb6387?w=600&q=80&auto=format&fit=crop"
              alt="Pharmacist helping customer"
              className="h-full w-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
          </div>
          <p className="max-w-xs text-xs text-muted leading-relaxed">
            Compassionate, expert pharmacy and health care. Consultations, refills, and everyday health products.
          </p>
          {/* Social icons */}
          <div className="flex gap-3">
            {[
              { href: "https://instagram.com", label: "Instagram", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
              { href: "https://linkedin.com", label: "LinkedIn", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
              { href: "https://twitter.com", label: "X", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-divider text-muted hover:border-teal hover:text-teal transition-colors duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-teal">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-offwhite/70 transition-colors hover:text-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-teal">Newsletter</h4>
          <p className="mb-3 text-xs text-muted leading-relaxed">Get health tips and pharmacy updates straight to your inbox.</p>
          <form className="flex flex-col gap-2" action="#">
            <input
              type="email"
              placeholder="Your email"
              className="rounded-lg border border-divider bg-navy px-3 py-2 text-xs text-offwhite placeholder:text-muted/60 focus:border-teal focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-navy hover:brightness-110 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>

      </div>

      <div className="border-t border-divider/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} NexMed. All rights reserved.</p>
          <p>Pharmacy &amp; Health Solutions</p>
        </div>
      </div>
    </footer>
  );
}
