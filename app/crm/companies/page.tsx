import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listCompanies } from "@/lib/crm/companies";
import { CompanyForm } from "./CompanyForm";

export const metadata: Metadata = { title: "Companies · CRM" };

export default async function CompaniesPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/crm/companies");
  if (!(await isAdmin())) redirect("/login?redirect=/crm/companies");

  const companies = await listCompanies();

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Sales CRM</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Companies</h1>
      <p className="mb-8 text-muted">Optional. Most NexMed contacts are individuals, but corporate or insurer accounts can be grouped here.</p>

      <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Add company</h2>
        <CompanyForm />
      </div>

      {companies.length === 0 ? (
        <p className="text-muted">No companies yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Contacts</th>
                <th className="px-4 py-3 font-medium">Deals</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-divider">
                  <td className="px-4 py-3 text-offwhite">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.industry ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.contactCount}</td>
                  <td className="px-4 py-3 text-muted">{c.dealCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
