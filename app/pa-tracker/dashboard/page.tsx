import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUser, isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listOverdueCases } from "@/lib/pa-tracker/cases";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Overdue PA Cases" };

export default async function PaTrackerDashboardPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/pa-tracker/dashboard");
  if (!(await isAdmin())) redirect("/login?redirect=/pa-tracker/dashboard");

  const user = await getUser();
  const overdue = await listOverdueCases(user!.id);

  // Resolve creator/assignee labels (no direct FK join available).
  const admin = createAdminClient();
  const userIds = [...new Set(overdue.flatMap((c) => [c.createdBy, c.assignedTo].filter(Boolean)))] as string[];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Staff tool</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">Overdue PA cases</h1>
        </div>
        <Link href="/pa-tracker" className="text-sm text-teal hover:underline">
          ← All cases
        </Link>
      </div>

      {overdue.length === 0 ? (
        <div className="rounded-2xl border border-divider bg-card p-8 text-center">
          <p className="text-muted">Nothing overdue — you're all caught up.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Case</th>
                <th className="px-4 py-3 font-medium">Insurer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((c) => {
                const assignee = c.assignedTo ? profileById.get(c.assignedTo) : null;
                const daysOverdue = Math.floor(
                  (Date.now() - new Date(c.dueAt!).getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <tr key={c.id} className="border-b border-divider last:border-0">
                    <td className="px-4 py-3 text-offwhite">
                      <Link href={`/pa-tracker/${c.id}`} className="hover:text-teal hover:underline">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-offwhite/90">{c.insurer}</td>
                    <td className="px-4 py-3 capitalize text-gold">{c.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(c.dueAt!).toLocaleDateString()}{" "}
                      <span className="text-red-400">({daysOverdue}d overdue)</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {assignee?.full_name ?? assignee?.email ?? "Unassigned"}
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
