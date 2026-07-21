import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUser, isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listCases } from "@/lib/pa-tracker/cases";
import { listStaff } from "@/lib/pa-tracker/staff";
import { NewCaseForm } from "./NewCaseForm";

export const metadata: Metadata = { title: "PA Tracker" };

const STATUS_STYLES: Record<string, string> = {
  new: "bg-divider text-muted",
  sent: "bg-sky/15 text-sky",
  waiting: "bg-gold/15 text-gold",
  approved: "bg-health/15 text-health",
  denied: "bg-red-500/15 text-red-400",
};

export default async function PaTrackerPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/pa-tracker");
  if (!(await isAdmin())) redirect("/login?redirect=/pa-tracker");

  const user = await getUser();
  const [cases, staff] = await Promise.all([listCases(user!.id), listStaff()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Staff tool</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">PA Tracker</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Create a case in under 30 seconds, track it through to approval, and never lose a follow-up again.
          </p>
        </div>
        <Link href="/pa-tracker/dashboard" className="shrink-0 text-sm text-teal hover:underline">
          Overdue dashboard →
        </Link>
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
        <h2 className="mb-5 text-lg font-semibold text-offwhite">New case</h2>
        <NewCaseForm staff={staff} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Your cases</h2>
        {cases.length === 0 ? (
          <p className="text-muted">No cases yet. Create your first one above.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-divider bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Case</th>
                  <th className="px-4 py-3 font-medium">Insurer</th>
                  <th className="px-4 py-3 font-medium">Medication</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-divider last:border-0">
                    <td className="px-4 py-3 text-offwhite">
                      <Link href={`/pa-tracker/${c.id}`} className="hover:text-teal hover:underline">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-offwhite/90">{c.insurer}</td>
                    <td className="px-4 py-3 text-offwhite/90">{c.medication}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? "bg-divider text-muted"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.dueAt ? new Date(c.dueAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
