import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentId } from "./types";

const MAX_ACTIVE_PER_AGENT = 8; // retention cap — oldest active lessons retire past this
const MAX_LESSONS_IN_PROMPT = 5; // injection cap — separate from retention, keeps prompts short

/** Appended to an agent's system prompt before it runs. Capped so this
 * self-improvement loop can't grow into an unbounded, unreviewable prompt. */
export async function lessonsBlockFor(agent: AgentId): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_lessons")
    .select("lesson")
    .eq("agent", agent)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(MAX_LESSONS_IN_PROMPT);

  if (!data || data.length === 0) return "";
  return `\n\nLessons learned from previous runs — apply these:\n${data.map((l) => `- ${l.lesson}`).join("\n")}`;
}

/** Writes new lessons and retires the oldest active ones past the cap, per
 * agent, so the memory stays bounded without needing a separate cron. */
export async function saveLessons(entries: { agent: AgentId; lesson: string; source: "critic" | "human" }[]): Promise<void> {
  if (entries.length === 0) return;
  const admin = createAdminClient();
  await admin.from("blog_lessons").insert(entries);

  for (const agent of new Set(entries.map((e) => e.agent))) {
    const { data } = await admin
      .from("blog_lessons")
      .select("id")
      .eq("agent", agent)
      .eq("active", true)
      .order("created_at", { ascending: false });
    const toRetire = (data ?? []).slice(MAX_ACTIVE_PER_AGENT).map((r) => r.id);
    if (toRetire.length > 0) {
      await admin.from("blog_lessons").update({ active: false }).in("id", toRetire);
    }
  }
}
