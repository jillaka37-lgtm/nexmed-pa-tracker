"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";

export type StaffMessageState = { ok: boolean; error?: string };

export async function replyToPatient(_prev: StaffMessageState, formData: FormData): Promise<StaffMessageState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };
  const actor = await getUser();

  const userId = String(formData.get("user_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!userId || !body) return { ok: false, error: "Message can't be empty." };

  const admin = createAdminClient();
  const { error } = await admin.from("patient_messages").insert({
    user_id: userId,
    sender_role: "staff",
    body,
    created_by: actor?.id ?? null,
    read_by_staff_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Couldn't send the reply." };

  await logAction(actor?.id ?? null, "staff_message_sent", userId);
  revalidatePath(`/admin/messages/${userId}`);
  revalidatePath("/admin/messages");
  return { ok: true };
}
