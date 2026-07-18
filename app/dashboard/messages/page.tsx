import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markMessagesRead } from "@/app/dashboard/actions";
import { MessageForm } from "./MessageForm";

export const metadata: Metadata = { title: "Messages" };

type Message = { id: string; sender_role: "patient" | "staff"; body: string; created_at: string };

export default async function MessagesPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("patient_messages")
    .select("id, sender_role, body, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const messages = (data ?? []) as Message[];
  await markMessagesRead();

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">Messages</h1>
      <p className="mt-2 text-muted">A direct line to our pharmacy team.</p>

      <div className="mt-8 rounded-2xl border border-divider bg-surface p-6">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted">No messages yet — say hello below.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_role === "patient" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.sender_role === "patient" ? "bg-teal/15 text-offwhite" : "bg-navy text-offwhite"
                  }`}
                >
                  <p>{m.body}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 border-t border-divider pt-6">
          <MessageForm />
        </div>
      </div>
    </div>
  );
}
