import { createAdminClient } from "@/lib/supabase/admin";

/** Generic app-wide audit trail — not PA Tracker-specific. Call at
 * meaningful state changes: login, case deletion, payment, etc. */
export async function logAction(
  userId: string | null,
  action: string,
  target?: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    user_id: userId,
    action,
    target: target ?? null,
  });
}

export async function logAiCall(input: {
  userId: string | null;
  feature: string;
  prompt: string;
  response?: unknown;
  error?: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("ai_log").insert({
    user_id: input.userId,
    feature: input.feature,
    prompt: input.prompt,
    response: input.response ?? null,
    error: input.error ?? null,
  });
}
