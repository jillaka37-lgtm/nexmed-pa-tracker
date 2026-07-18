import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { StaffShell } from "@/components/staff/StaffShell";
import { DashboardNav } from "./DashboardNav";

const PATIENT_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/appointments", label: "Appointments" },
  { href: "/dashboard/refills", label: "Refill Requests" },
  { href: "/dashboard/medications", label: "My Medications" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/dashboard");

  const user = await getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const profile = await getProfile();
  const greeting = profile?.full_name?.trim() || profile?.email || "there";

  // Same /dashboard URL for everyone — the shell (and its nav) is chosen by
  // role. Staff get the unified Operations + CRM console; patients get
  // their own account view. Keeps "one dashboard" true at the URL level.
  if (profile?.role === "admin") {
    return <StaffShell greeting={greeting}>{children}</StaffShell>;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">My account</p>
          <p className="mt-1 truncate text-sm text-offwhite">{greeting}</p>
        </div>
        <DashboardNav items={PATIENT_NAV_ITEMS} />
        <form action="/auth/signout" method="post" className="mt-4">
          <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-navy hover:text-teal">
            Logout
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
