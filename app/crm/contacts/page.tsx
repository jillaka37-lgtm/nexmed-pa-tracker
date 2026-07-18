import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listContacts } from "@/lib/crm/contacts";
import { listCompanies } from "@/lib/crm/companies";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contacts · CRM" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!hasSupabaseEnv) redirect("/login?redirect=/crm/contacts");
  if (!(await isAdmin())) redirect("/login?redirect=/crm/contacts");

  const { q } = await searchParams;
  const [contacts, companies] = await Promise.all([listContacts(q), listCompanies()]);

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Sales CRM</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Contacts</h1>
      <p className="mb-8 text-muted">Every person who&apos;s been converted from a lead or added directly.</p>

      <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Add contact</h2>
        <ContactForm companies={companies} />
      </div>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-sm rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
        />
      </form>

      {contacts.length === 0 ? (
        <p className="text-muted">No contacts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-divider hover:bg-navy/50">
                  <td className="px-4 py-3">
                    <Link href={`/crm/contacts/${c.id}`} className="font-medium text-teal hover:underline">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.email ?? c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.companyName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted">{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
