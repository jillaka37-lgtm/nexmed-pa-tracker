"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type DashboardState = { ok: boolean; error?: string; message?: string };

export async function updateProfile(_prev: DashboardState, formData: FormData): Promise<DashboardState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!fullName) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Couldn't update your profile." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Profile updated." };
}

export async function sendMessage(_prev: DashboardState, formData: FormData): Promise<DashboardState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Message can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("patient_messages").insert({
    user_id: user.id,
    sender_role: "patient",
    body,
    created_by: user.id,
  });
  if (error) return { ok: false, error: "Couldn't send your message." };

  revalidatePath("/dashboard/messages");
  return { ok: true };
}

export async function markMessagesRead(): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase
    .from("patient_messages")
    .update({ read_by_patient_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("sender_role", "staff")
    .is("read_by_patient_at", null);
}
