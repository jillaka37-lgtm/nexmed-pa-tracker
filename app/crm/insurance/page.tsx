import type { Metadata } from "next";
import { listInsuranceCompanies } from "@/lib/crm/insurers";
import { InsuranceForm } from "./InsuranceForm";

export const metadata: Metadata = { title: "Insurance Companies · CRM" };

export default async function InsurancePage() {
  const insurers = await listInsuranceCompanies();

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Insurance Companies</h1>
      <p className="mb-8 text-muted">Payers your pharmacy files claims with.</p>

      <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Add insurance company</h2>
        <InsuranceForm />
      </div>

      {insurers.length === 0 ? (
        <p className="text-muted">No insurance companies yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Claims email</th>
              </tr>
            </thead>
            <tbody>
              {insurers.map((i) => (
                <tr key={i.id} className="border-b border-divider">
                  <td className="px-4 py-3 text-offwhite">{i.name}</td>
                  <td className="px-4 py-3 text-muted">{i.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{i.claimsEmail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
