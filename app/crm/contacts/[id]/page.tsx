import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getContact } from "@/lib/crm/contacts";
import { listDealsForContact } from "@/lib/crm/deals";
import { listContactTimeline } from "@/lib/crm/activities";
import { formatCents, STATUS_STYLES } from "@/components/crm/ui";
import { ActivityForm } from "./ActivityForm";
import { DealForm } from "./DealForm";
import { SummarizeChatButton } from "./SummarizeChatButton";
import { DealNextActionButton } from "./DealNextActionButton";

export const metadata: Metadata = { title: "Contact · CRM" };

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/crm/contacts");
  if (!(await isAdmin())) redirect("/login?redirect=/crm/contacts");

  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();

  const [deals, timeline] = await Promise.all([listDealsForContact(id), listContactTimeline(id)]);

  return (
    <div className="max-w-4xl">
      <Link href="/crm/contacts" className="text-sm text-teal hover:underline">← All contacts</Link>

      <div className="mt-4 mb-10 rounded-2xl border border-divider bg-card p-6">
        <h1 className="font-serif text-3xl font-bold text-offwhite">{contact.fullName}</h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Email</dt><dd className="text-offwhite">{contact.email ?? "—"}</dd></div>
          <div><dt className="text-muted">Phone</dt><dd className="text-offwhite">{contact.phone ?? "—"}</dd></div>
          <div><dt className="text-muted">Company</dt><dd className="text-offwhite">{contact.companyName ?? "—"}</dd></div>
          <div><dt className="text-muted">Source</dt><dd className="text-offwhite uppercase text-xs tracking-wide">{contact.source}</dd></div>
        </dl>
        {contact.notes && <p className="mt-4 text-sm text-muted">{contact.notes}</p>}
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Deals</h2>
        {deals.length > 0 && (
          <ul className="mb-4 space-y-2">
            {deals.map((d) => (
              <li key={d.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-offwhite">{d.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted">{formatCents(d.amountCents)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[d.stageKey] ?? STATUS_STYLES.open}`}>
                      {d.stageKey}
                    </span>
                  </span>
                </div>
                {d.status === "open" && <DealNextActionButton dealId={d.id} />}
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-2xl border border-divider bg-card p-6">
          <h3 className="mb-3 text-sm font-semibold text-offwhite">New deal</h3>
          <DealForm contactId={id} companyId={contact.companyId} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-offwhite">Timeline</h2>
          <SummarizeChatButton contactId={id} />
        </div>
        <div className="mb-6 rounded-2xl border border-divider bg-card p-6">
          <ActivityForm contactId={id} />
        </div>
        {timeline.length === 0 ? (
          <p className="text-muted">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((a) => (
              <li key={a.id} className="rounded-lg border border-divider bg-card px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-offwhite">{a.title}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">{a.type}</span>
                </div>
                {a.body && <p className="mt-1 text-muted">{a.body}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
