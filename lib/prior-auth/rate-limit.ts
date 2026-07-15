import { createAdminClient } from "@/lib/supabase/admin";

const DAILY_LIMIT = 50;

export class RateLimitError extends Error {
  constructor(public resetAt: Date) {
    super(
      `Daily draft limit reached (${DAILY_LIMIT}/day). Limit resets at midnight — try again after ${resetAt.toLocaleString()}.`,
    );
    this.name = "RateLimitError";
  }
}

/** Checks and increments today's usage count for a user. Throws RateLimitError if over the cap. */
export async function checkAndIncrementUsage(userId: string): Promise<void> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("prior_auth_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  const currentCount = existing?.count ?? 0;
  if (currentCount >= DAILY_LIMIT) {
    const resetAt = new Date();
    resetAt.setHours(24, 0, 0, 0);
    throw new RateLimitError(resetAt);
  }

  await admin
    .from("prior_auth_usage")
    .upsert(
      { user_id: userId, day: today, count: currentCount + 1 },
      { onConflict: "user_id,day" },
    );
}
