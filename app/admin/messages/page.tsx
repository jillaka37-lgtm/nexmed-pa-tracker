import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Patient Messages" };

export default async function AdminMessagesPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/admin/messages");
  if (!(await isAdmin())) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: threads } = await admin
    .from("patient_messages")
    .select("user_id, sender_role, body, created_at, read_by_staff_at")
    .order("created_at", { ascending: false });

  type Row = { user_id: string; sender_role: string; body: string; created_at: string; read_by_staff_at: string | null };
  const rows = (threads ?? []) as Row[];

  const byUser = new Map<string, { last: Row; unread: number }>();
  for (const row of rows) {
    const existing = byUser.get(row.user_id);
    if (!existing) byUser.set(row.user_id, { last: row, unread: 0 });
    const entry = byUser.get(row.user_id)!;
    if (row.sender_role === "patient" && !row.read_by_staff_at) entry.unread += 1;
  }

  const userIds = [...byUser.keys()];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const threadList = [...byUser.entries()].sort((a, b) => new Date(b[1].last.created_at).getTime() - new Date(a[1].last.created_at).getTime());

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-serif text-3xl font-bold text-offwhite">Patient Messages</h1>
      <p className="mb-8 text-muted">Conversations from the customer dashboard inbox.</p>

      {threadList.length === 0 ? (
        <p className="text-muted">No messages yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Last message</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Unread</th>
              </tr>
            </thead>
            <tbody>
              {threadList.map(([userId, { last, unread }]) => {
                const profile = profileMap.get(userId);
                return (
                  <tr key={userId} className="border-b border-divider hover:bg-navy/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/messages/${userId}`} className="font-medium text-teal hover:underline">
                        {profile?.full_name || profile?.email || userId}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">{last.body}</td>
                    <td className="px-4 py-3 text-muted">{new Date(last.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {unread > 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">{unread}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
