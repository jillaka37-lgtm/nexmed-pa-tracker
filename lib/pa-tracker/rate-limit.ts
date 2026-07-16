import { createAdminClient } from "@/lib/supabase/admin";

const DAILY_LIMIT = 50;

export class RateLimitError extends Error {
  constructor(public resetAt: Date) {
    super(
      `Daily limit reached (${DAILY_LIMIT} PA cases/day). Try again after ${resetAt.toLocaleString()}.`,
    );
    this.name = "RateLimitError";
  }
}

/** Atomically increments today's case-creation count for a user and throws
 * RateLimitError if that pushed it over the cap. Single DB-side
 * INSERT ... ON CONFLICT DO UPDATE ... RETURNING — not a read-then-write,
 * which would be racy under concurrent requests. */
export async function checkAndIncrementUsage(userId: string): Promise<void> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: newCount, error } = await admin.rpc("increment_pa_usage", {
    p_user_id: userId,
    p_day: today,
  });

  if (error) {
    throw new Error(`Failed to check usage limit: ${error.message}`);
  }

  if ((newCount ?? 0) > DAILY_LIMIT) {
    const resetAt = new Date();
    resetAt.setHours(24, 0, 0, 0);
    throw new RateLimitError(resetAt);
  }
}
