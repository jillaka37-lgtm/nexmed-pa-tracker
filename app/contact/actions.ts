"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { sendContactNotification } from "@/lib/email";

export type ContactState = {
  ok: boolean;
  error?: string;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in your name, email and message." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (hasSupabaseEnv) {
    try {
      const supabase = await createClient();
      await supabase.from("contact_messages").insert({ name, email, message });
    } catch {
      // Non-fatal: still attempt the email notification below.
    }
  }

  await sendContactNotification({ name, email, message });

  return { ok: true };
}
