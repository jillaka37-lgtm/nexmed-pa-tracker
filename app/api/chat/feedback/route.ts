import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { messageId?: string; sessionId?: string; rating?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messageId, sessionId, rating } = body;
  if (!messageId || !sessionId || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: "messageId, sessionId and rating (1 or -1) are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  await Promise.all([
    admin.from("chat_feedback").insert({ message_id: messageId, session_id: sessionId, rating }),
    admin.from("chat_messages").update({ feedback: rating }).eq("id", messageId),
  ]);

  return NextResponse.json({ ok: true });
}
