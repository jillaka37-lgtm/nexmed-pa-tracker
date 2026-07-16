import { createAdminClient } from "@/lib/supabase/admin";

export type StaffOption = { id: string; label: string };

/** "Assign to staff member" = any other admin-role profile — there's no
 * separate staff/team concept in this repo today. */
export async function listStaff(): Promise<StaffOption[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name ?? p.email ?? p.id,
  }));
}
