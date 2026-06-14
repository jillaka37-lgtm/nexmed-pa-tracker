import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "client" | "admin";
};

/** Current authenticated user, or null (also null when Supabase isn't configured). */
export async function getUser(): Promise<User | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user's profile row, or null. */
export async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
