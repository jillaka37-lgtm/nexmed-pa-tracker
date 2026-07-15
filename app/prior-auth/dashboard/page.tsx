import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listDrafts } from "@/lib/prior-auth/list";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "./CopyLinkButton";

export const metadata: Metadata = { title: "Prior Auth Drafts" };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gold/15 text-gold",
  reviewed: "bg-sky/15 text-sky",
  submitted: "bg-health/15 text-health",
};

export default async function PriorAuthDashboardPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/prior-auth/dashboard");
  if (!(await isAdmin())) redirect("/login?redirect=/prior-auth/dashboard");

  const drafts = await listDrafts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Staff tool
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">
            Prior auth drafts
          </h1>
        </div>
        <Link href="/prior-auth">
          <Button>New draft</Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-divider bg-card p-8 text-center">
          <p className="text-muted">No drafts yet.</p>
          <Link href="/prior-auth" className="mt-3 inline-block text-sm text-teal hover:underline">
            Create your first one
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Case ID</th>
                <th className="px-4 py-3 font-medium">Insurer</th>
                <th className="px-4 py-3 font-medium">Medication</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr key={draft.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-3 text-offwhite">
                    <Link href={`/prior-auth/${draft.id}`} className="hover:text-teal hover:underline">
                      {draft.caseId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-offwhite/90">{draft.insurer}</td>
                  <td className="px-4 py-3 text-offwhite/90">{draft.medication}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[draft.status] ?? "bg-divider text-muted"}`}
                    >
                      {draft.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CopyLinkButton draftId={draft.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
