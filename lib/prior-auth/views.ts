import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a view. Fails silently (logs, doesn't throw) — view tracking is
 * secondary to actually showing the draft, and the prior_auth_views table
 * may not exist yet if migration 0010 hasn't been applied.
 */
export async function recordView(draftId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("prior_auth_views").insert({ draft_id: draftId });
    if (error) console.error("recordView failed:", error.message);
  } catch (err) {
    console.error("recordView failed:", err);
  }
}

/** Returns view counts per draft ID. Returns an empty map on failure
 * (e.g. table doesn't exist yet) rather than throwing. */
export async function getViewCounts(draftIds: string[]): Promise<Record<string, number>> {
  if (draftIds.length === 0) return {};
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prior_auth_views")
      .select("draft_id")
      .in("draft_id", draftIds);

    if (error || !data) return {};

    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.draft_id] = (counts[row.draft_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}
