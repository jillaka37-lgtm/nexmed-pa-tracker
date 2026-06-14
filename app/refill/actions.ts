"use server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { sendRefillNotification, sendRefillConfirmation } from "@/lib/email";

export type RefillState = { ok: boolean; error?: string };

export async function submitRefill(
  _prev: RefillState,
  formData: FormData,
): Promise<RefillState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const date_of_birth = String(formData.get("date_of_birth") ?? "").trim();
  const medication_name = String(formData.get("medication_name") ?? "").trim();
  const prescription_number = String(
    formData.get("prescription_number") ?? "",
  ).trim();
  const dosage = String(formData.get("dosage") ?? "").trim();
  const current_pharmacy = String(formData.get("current_pharmacy") ?? "").trim();
  const fulfilment =
    formData.get("fulfilment") === "delivery" ? "delivery" : "pickup";
  const delivery_address = String(formData.get("delivery_address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!full_name || !email || !phone || !medication_name) {
    return {
      ok: false,
      error: "Please fill in your name, email, phone, and medication.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (fulfilment === "delivery" && !delivery_address) {
    return {
      ok: false,
      error: "Please add a delivery address, or choose pickup.",
    };
  }

  if (hasSupabaseEnv) {
    try {
      const user = await getUser();
      const supabase = await createClient();
      await supabase.from("prescription_refills").insert({
        user_id: user?.id ?? null,
        full_name,
        email,
        phone,
        date_of_birth: date_of_birth || null,
        medication_name,
        prescription_number: prescription_number || null,
        dosage: dosage || null,
        current_pharmacy: current_pharmacy || null,
        fulfilment,
        delivery_address: fulfilment === "delivery" ? delivery_address : null,
        notes: notes || null,
      });
    } catch {
      // Non-fatal: still attempt the notifications below.
    }
  }

  await Promise.all([
    sendRefillNotification({
      name: full_name,
      email,
      phone,
      medication: medication_name,
      fulfilment,
    }),
    sendRefillConfirmation({ to: email, name: full_name, medication: medication_name }),
  ]);

  return { ok: true };
}
