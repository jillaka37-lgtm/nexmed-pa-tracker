"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/eval", label: "Overview", exact: true },
  { href: "/admin/eval/learn", label: "Learn" },
  { href: "/admin/eval/suites", label: "Golden Set" },
  { href: "/admin/eval/production", label: "Production" },
  { href: "/admin/eval/cost", label: "Cost & Latency" },
  { href: "/admin/eval/judge", label: "Judge of Judge" },
];

export function EvalSubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-divider pb-4">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-teal/10 text-teal" : "text-muted hover:text-offwhite"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
