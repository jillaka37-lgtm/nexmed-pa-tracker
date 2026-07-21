import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Finds the chatbot conversation tied to a contact via email match against
 * chat_leads (the chatbot's own lead-capture table) — there's no direct
 * foreign key between contacts and chat_sessions since they're separate
 * systems that only share an email address. Returns the most recent
 * session's transcript, or null if this contact never talked to the bot.
 */
export async function getChatTranscriptForEmail(email: string | null): Promise<{ role: string; content: string }[] | null> {
  if (!email) return null;
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("chat_leads")
    .select("session_id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lead?.session_id) return null;

  const { data: messages, error } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", lead.session_id)
    .order("created_at", { ascending: true });
  if (error || !messages || messages.length === 0) return null;

  return messages;
}
