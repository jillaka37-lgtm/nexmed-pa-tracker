"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    label: "CRM — Sales",
    items: [
      { href: "/crm", label: "Leads", exact: true },
      { href: "/crm/contacts", label: "Contacts" },
      { href: "/crm/companies", label: "Companies" },
      { href: "/crm/deals", label: "Deals" },
    ],
  },
  {
    label: "CRM — Care Coordination",
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

export function StaffShell({ greeting, children }: { greeting: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
      <aside className="shrink-0 rounded-2xl border border-divider/50 bg-navy/80 p-4 backdrop-blur-md lg:sticky lg:top-20 lg:h-fit lg:w-60">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">Staff console</p>
          <p className="mt-0.5 truncate text-sm text-offwhite">{greeting}</p>
        </div>
        <nav className="flex flex-col gap-4" aria-label="Staff navigation">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{group.label}</p>
              <div className="flex flex-col">
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
            </div>
          ))}
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
