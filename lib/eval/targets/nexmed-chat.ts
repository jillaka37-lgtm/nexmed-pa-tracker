import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/chatbot/rag";
import type { RetrievedSource } from "../types";

export type TargetResponse = {
  text: string;
  latencyMs: number;
  ragHit: boolean | null;
  sources: RetrievedSource[];
  sourceText: string;
  error?: string;
};

// The live chat endpoint has no documented per-IP rate limit, but hammering
// it with zero gap between eval cases would still be a bad citizen against
// the same OpenRouter budget the real chatbot uses. A small fixed gap is
// cheap insurance, mirroring the pattern from the eval-template project.
const MIN_GAP_MS = 1200;
let lastCallAt = 0;

async function throttle() {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

function chatUrl(): string {
  const base = process.env.EVAL_TARGET_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/chat`;
}

/**
 * Retrieves the same sources brain.ts would have retrieved for this
 * message — same embedding model, same RPC, same threshold — so the
 * faithfulness judge has real source text to check claims against.
 * chat_messages only stores a rag_hit boolean, not the retrieved content,
 * so this is re-derived rather than read back; a second call is the only
 * way to get it after the fact for our own product.
 */
async function getSources(query: string): Promise<{ sources: RetrievedSource[]; sourceText: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { sources: [], sourceText: "" };
  }
  try {
    const queryEmbedding = await embedText(query);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("match_chat_documents", {
      query_embedding: queryEmbedding,
      match_count: 4,
      match_threshold: 0.4,
    });
    if (error || !data?.length) return { sources: [], sourceText: "" };

    const rows = data as { title: string; content: string; similarity: number }[];
    return {
      sources: rows.map((r) => ({ title: r.title, similarity: r.similarity })),
      sourceText: rows.map((r) => `### ${r.title} (similarity ${r.similarity.toFixed(2)})\n${r.content}`).join("\n\n"),
    };
  } catch {
    return { sources: [], sourceText: "" };
  }
}

/**
 * Adapter for NexMed's own /api/chat. Unlike the arkan-eval template (which
 * reads sources from a custom response header), this is our own product:
 * after the chat call, we look the message up in chat_messages by the
 * messageId the endpoint returns to read rag_hit, and independently
 * re-derive the actual source text via getSources() above.
 */
export async function sendToNexmedChat(message: string, sessionId?: string | null): Promise<TargetResponse & { sessionId: string | null }> {
  await throttle();
  const start = Date.now();

  let res: Response;
  try {
    res = await fetch(chatUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId: sessionId ?? undefined, channel: "web" }),
    });
  } catch (err) {
    return {
      text: "",
      latencyMs: Date.now() - start,
      ragHit: null,
      sources: [],
      sourceText: "",
      sessionId: sessionId ?? null,
      error: `target unreachable (is the site up / not paused?): ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    return { text: "", latencyMs, ragHit: null, sources: [], sourceText: "", sessionId: sessionId ?? null, error: `HTTP ${res.status}` };
  }

  const body = (await res.json()) as { text?: string; sessionId?: string; messageId?: string };

  let ragHit: boolean | null = null;
  if (body.messageId) {
    const admin = createAdminClient();
    const { data } = await admin.from("chat_messages").select("rag_hit").eq("id", body.messageId).maybeSingle();
    ragHit = data?.rag_hit ?? null;
  }

  const { sources, sourceText } = await getSources(message);

  return {
    text: body.text ?? "",
    latencyMs,
    ragHit,
    sources,
    sourceText,
    sessionId: body.sessionId ?? sessionId ?? null,
  };
}
