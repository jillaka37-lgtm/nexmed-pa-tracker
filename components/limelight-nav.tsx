"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/refill", label: "Refill" },
  { href: "/medication-info", label: "Medication" },
  { href: "/services", label: "Consultations" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function LimelightNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const navItems = isAdmin
    ? [{ href: "/pa-tracker", label: "Dashboard" }, ...baseNavItems]
    : baseNavItems;
  const activeIndex = navItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  const [light, setLight] = useState({ left: 0, width: 0 });
  const [ready, setReady] = useState(false);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const idx = activeIndex >= 0 ? activeIndex : -1;
    if (idx === -1) return;
    const el = itemRefs.current[idx];
    const nav = navRef.current;
    if (!el || !nav) return;
    setLight({ left: el.offsetLeft, width: el.offsetWidth });
    setReady(true);
  }, [activeIndex, pathname]);

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center gap-1 md:flex"
      aria-label="Main navigation"
    >
      {/* Sliding limelight */}
      {ready && activeIndex >= 0 && (
        <span
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-teal transition-all duration-300 ease-in-out"
          style={{ left: light.left, width: light.width }}
        />
      )}

      {navItems.map((item, i) => {
        const isActive = activeIndex === i;
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => { itemRefs.current[i] = el; }}
            className={`relative px-2 py-1 text-xs font-medium transition-colors duration-150 ${
              isActive ? "text-teal" : "text-muted hover:text-offwhite"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
