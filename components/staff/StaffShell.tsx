"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", exact: true },
      { href: "/pa-tracker", label: "PA Tracker" },
      { href: "/admin/refills", label: "Refills" },
      { href: "/admin/medications", label: "Medications" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/appointments", label: "Appointments" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
  {
    label: "AI Studios",
    items: [
      { href: "/admin/content-studio", label: "Content Studio" },
      { href: "/admin/blog-agents", label: "Blog Agents" },
      { href: "/admin/eval", label: "Eval Dashboard" },
    ],
  },
  {
    label: "CRM Sales",
    items: [
      { href: "/crm", label: "Leads", exact: true },
      { href: "/crm/contacts", label: "Contacts" },
      { href: "/crm/companies", label: "Companies" },
      { href: "/crm/deals", label: "Deals" },
    ],
  },
  {
    label: "CRM Care Coordination",
    items: [
      { href: "/crm/patients", label: "Patients" },
      { href: "/crm/prescribers", label: "Prescribers" },
      { href: "/crm/insurance", label: "Insurance" },
      { href: "/crm/pharmacy-contacts", label: "Pharmacy Contacts" },
      { href: "/crm/communications", label: "Communications" },
      { href: "/crm/activity", label: "Activity" },
    ],
  },
];

function groupIsActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StaffShell({ greeting, children }: { greeting: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // Collapsed by default; whichever group contains the current page starts
  // open. Click a group's header to expand/collapse it — keeps the sidebar
  // short without hiding anything.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, groupIsActive(g, pathname)])),
  );

  function toggle(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/8669982/pexels-photo-8669982.jpeg?auto=compress&cs=tinysrgb&w=1600"
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover"
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-navy/90" />
      <aside className="shrink-0 rounded-2xl border border-divider/50 bg-navy/80 p-4 backdrop-blur-md lg:sticky lg:top-20 lg:h-fit lg:w-64">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">Staff console</p>
          <p className="mt-0.5 truncate text-sm text-offwhite">{greeting}</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Staff navigation">
          {GROUPS.map((group) => {
            const open = openGroups[group.label];
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-offwhite"
                >
                  <span>{group.label}</span>
                  <ChevronIcon open={!!open} />
                </button>
                {open && (
                  <div className="flex flex-col pb-1">
                    {group.items.map((item) => {
                      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            active ? "bg-teal/10 text-teal" : "text-muted hover:bg-navy hover:text-offwhite"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <form action="/auth/signout" method="post" className="mt-4 border-t border-divider/50 pt-3">
          <button type="submit" className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-muted transition-colors hover:bg-navy hover:text-teal">
            Logout
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
