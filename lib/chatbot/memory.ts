import { createAdminClient } from "@/lib/supabase/admin";

export type ChatMessage = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string | null;
};

const SHORT_TERM_LIMIT = 20;

export async function getOrCreateSession(opts: {
  sessionId?: string;
  channel: "web" | "telegram" | "widget";
  telegramChatId?: number;
  userId?: string;
}): Promise<string> {
  const admin = createAdminClient();

  if (opts.sessionId) {
    const { data } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("id", opts.sessionId)
      .maybeSingle();
    if (data) return data.id;
  }

  if (opts.telegramChatId) {
    const { data: existing } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("telegram_chat_id", opts.telegramChatId)
      .maybeSingle();
    if (existing) return existing.id;
  }

  const { data: created, error } = await admin
    .from("chat_sessions")
    .insert({
      channel: opts.channel,
      telegram_chat_id: opts.telegramChatId ?? null,
      user_id: opts.userId ?? null,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(`Failed to create session: ${error?.message}`);
  return created.id;
}

export async function loadHistory(sessionId: string): Promise<ChatMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("chat_messages")
    .select("role, content, tool_name")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(SHORT_TERM_LIMIT);

  return (data ?? []) as ChatMessage[];
}

export async function saveMessages(
  sessionId: string,
  messages: ChatMessage[],
  meta?: { latencyMs?: number; tokensUsed?: number; ragHit?: boolean },
): Promise<{ assistantMessageId: string | null }> {
  const admin = createAdminClient();

  // Insert all messages with base columns only
  const { data: inserted, error } = await admin
    .from("chat_messages")
    .insert(
      messages.map((m) => ({
        session_id: sessionId,
        role: m.role,
        content: m.content,
        tool_name: m.tool_name ?? null,
      })),
    )
    .select("id, role");

  await admin
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error || !inserted?.length) return { assistantMessageId: null };

  const assistantRow = (inserted as { id: string; role: string }[]).find(
    (r) => r.role === "assistant",
  );
  const assistantMessageId = assistantRow?.id ?? null;

  // Update metadata on the assistant message separately
  if (assistantMessageId && meta) {
    await admin
      .from("chat_messages")
      .update({
        latency_ms: meta.latencyMs ?? null,
        tokens_used: meta.tokensUsed ?? null,
        rag_hit: meta.ragHit ?? true,
      })
      .eq("id", assistantMessageId);
  }

  return { assistantMessageId };
}
