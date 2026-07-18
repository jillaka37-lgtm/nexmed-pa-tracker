import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listLeads } from "@/lib/crm/leads";
import { listOpenTasks } from "@/lib/crm/activities";
import { LeadRow } from "./LeadRow";

export const metadata: Metadata = { title: "CRM" };

export default async function CrmPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/crm");
  if (!(await isAdmin())) redirect("/login?redirect=/crm");

  const [leads, tasks] = await Promise.all([listLeads(), listOpenTasks()]);
  const openLeads = leads.filter((l) => !l.contactId);
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const now = Date.now();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Staff tool</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">CRM</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Inbound leads from the contact form and chatbot, unified in one place. Convert a lead into a
            contact to start tracking deals and follow-ups.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/crm/contacts" className="text-teal hover:underline">Contacts →</Link>
          <Link href="/crm/companies" className="text-teal hover:underline">Companies →</Link>
          <Link href="/crm/deals" className="text-teal hover:underline">Deals →</Link>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-offwhite">Open tasks</h2>
          <ul className="space-y-2 text-sm">
            {tasks.map((t) => {
              const overdue = t.dueAt ? new Date(t.dueAt).getTime() < now : false;
              return (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-divider px-3 py-2">
                  <div>
                    <span className={overdue ? "font-medium text-red-400" : "text-offwhite"}>{t.title}</span>
                    {t.dueAt && (
                      <span className={`ml-2 text-xs ${overdue ? "text-red-400" : "text-muted"}`}>
                        due {new Date(t.dueAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {t.contactId && (
                    <Link href={`/crm/contacts/${t.contactId}`} className="text-xs text-teal hover:underline">
                      view contact →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-offwhite">
        Leads {openLeads.length > 0 && <span className="text-muted">({openLeads.length} open)</span>}
      </h2>
      {leads.length === 0 ? (
        <p className="text-muted">No leads yet. They&apos;ll appear here from the contact form and chatbot.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">AI score</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
