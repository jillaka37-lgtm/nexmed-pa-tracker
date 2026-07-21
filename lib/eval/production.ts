import { createAdminClient } from "@/lib/supabase/admin";
import { estimateCostForModel } from "./pricing";

export type KnowledgeGap = { messageId: string; question: string; createdAt: string };
export type NegativeFeedback = { messageId: string; content: string; createdAt: string };

export type ProductionStats = {
  totalSessions: number;
  totalMessages: number;
  totalLeads: number;
  byChannel: { channel: string; sessions: number }[];
  satisfactionRate: number | null; // share of thumbs-up among rated messages
  conversionRate: number | null; // sessions that produced a lead
  knowledgeGaps: KnowledgeGap[];
  negativeFeedback: NegativeFeedback[];
  costUsd: number;
};

/**
 * Read-only against the live chatbot's own tables — this module must never
 * write here. Every query result is checked for an error and surfaced as
 * such; a failed query must never be quietly coerced to an empty array
 * (`data ?? []`), because a false "zero" that looks like real data is worse
 * than a visible error — nobody would notice the measurement had broken.
 */
export async function getProductionStats(): Promise<ProductionStats | { error: string }> {
  const admin = createAdminClient();

  const [sessionsRes, messagesRes, leadsRes] = await Promise.all([
    admin.from("chat_sessions").select("id, channel, created_at"),
    admin.from("chat_messages").select("id, session_id, role, content, feedback, tokens_used, rag_hit, created_at"),
    admin.from("chat_leads").select("id, session_id, created_at"),
  ]);

  if (sessionsRes.error) return { error: `chat_sessions: ${sessionsRes.error.message}` };
  if (messagesRes.error) return { error: `chat_messages: ${messagesRes.error.message}` };
  if (leadsRes.error) return { error: `chat_leads: ${leadsRes.error.message}` };

  const sessions = sessionsRes.data;
  const messages = messagesRes.data;
  const leads = leadsRes.data;

  const channelCounts = new Map<string, number>();
  for (const s of sessions) channelCounts.set(s.channel, (channelCounts.get(s.channel) ?? 0) + 1);

  const rated = messages.filter((m) => m.feedback === 1 || m.feedback === -1);
  const satisfactionRate = rated.length ? rated.filter((m) => m.feedback === 1).length / rated.length : null;

  const leadSessions = new Set(leads.map((l) => l.session_id));
  const conversionRate = sessions.length ? leadSessions.size / sessions.length : null;

  // A knowledge gap is an assistant message where retrieval found nothing —
  // the single most actionable signal this dashboard produces: each row is
  // a real question the knowledge base should have an answer for.
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const gapMessages = assistantMessages.filter((m) => m.rag_hit === false);
  const messagesBySession = new Map<string, typeof messages>();
  for (const m of messages) {
    const arr = messagesBySession.get(m.session_id) ?? [];
    arr.push(m);
    messagesBySession.set(m.session_id, arr);
  }
  const knowledgeGaps: KnowledgeGap[] = gapMessages.slice(0, 50).map((m) => {
    const sessionMsgs = (messagesBySession.get(m.session_id) ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const idx = sessionMsgs.findIndex((sm) => sm.id === m.id);
    const precedingUser = [...sessionMsgs.slice(0, idx)].reverse().find((sm) => sm.role === "user");
    return { messageId: m.id, question: precedingUser?.content ?? "(unknown)", createdAt: m.created_at };
  });

  const negativeFeedback: NegativeFeedback[] = messages
    .filter((m) => m.feedback === -1)
    .slice(0, 50)
    .map((m) => ({ messageId: m.id, content: m.content, createdAt: m.created_at }));

  const costUsd = messages
    .filter((m) => m.role === "assistant" && m.tokens_used)
    // tokens_used isn't split input/output in this schema — treat it all as
    // output tokens for a conservative (slightly high) cost estimate.
    .reduce((sum, m) => sum + estimateCostForModel("google/gemini-2.5-flash", 0, m.tokens_used ?? 0), 0);

  return {
    totalSessions: sessions.length,
    totalMessages: messages.length,
    totalLeads: leads.length,
    byChannel: [...channelCounts.entries()].map(([channel, sessions]) => ({ channel, sessions })),
    satisfactionRate,
    conversionRate,
    knowledgeGaps,
    negativeFeedback,
    costUsd,
  };
}
