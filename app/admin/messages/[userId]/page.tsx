import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReplyForm } from "./ReplyForm";

export const metadata: Metadata = { title: "Patient Thread" };

type Message = { id: string; sender_role: "patient" | "staff"; body: string; created_at: string };

export default async function AdminMessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/admin/messages");
  if (!(await isAdmin())) redirect("/dashboard");

  const { userId } = await params;
  const admin = createAdminClient();

  const [{ data: profile }, { data: messages }] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
    admin
      .from("patient_messages")
      .select("id, sender_role, body, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  await admin
    .from("patient_messages")
    .update({ read_by_staff_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("sender_role", "patient")
    .is("read_by_staff_at", null);

  const rows = (messages ?? []) as Message[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/admin/messages" className="text-sm text-teal hover:underline">← All conversations</Link>

      <h1 className="mt-4 mb-8 font-serif text-3xl font-bold text-offwhite">
        {profile?.full_name || profile?.email || "Patient"}
      </h1>

      <div className="rounded-2xl border border-divider bg-card p-6">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-center text-muted">No messages yet.</p>
          ) : (
            rows.map((m) => (
              <div key={m.id} className={`flex ${m.sender_role === "staff" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender_role === "staff" ? "bg-teal/15 text-offwhite" : "bg-navy text-offwhite"}`}>
                  <p>{m.body}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 border-t border-divider pt-6">
          <ReplyForm userId={userId} />
        </div>
      </div>
    </div>
  );
}
