import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { StaffShell } from "@/components/staff/StaffShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/admin");

  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin");

  const profile = await getProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  const greeting = profile?.full_name?.trim() || profile?.email || "there";
  return <StaffShell greeting={greeting}>{children}</StaffShell>;
}
