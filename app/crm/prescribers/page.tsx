import type { Metadata } from "next";
import { listPrescribers } from "@/lib/crm/prescribers";
import { PrescriberForm } from "./PrescriberForm";

export const metadata: Metadata = { title: "Prescribers · CRM" };

export default async function PrescribersPage() {
  const prescribers = await listPrescribers();

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Prescribers / Doctors</h1>
      <p className="mb-8 text-muted">External doctors and clinics your pharmacy coordinates with.</p>

      <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Add prescriber</h2>
        <PrescriberForm />
      </div>

      {prescribers.length === 0 ? (
        <p className="text-muted">No prescribers yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Clinic</th>
                <th className="px-4 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {prescribers.map((p) => (
                <tr key={p.id} className="border-b border-divider">
                  <td className="px-4 py-3 text-offwhite">{p.fullName}</td>
                  <td className="px-4 py-3 text-muted">{p.specialty ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.clinicName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.phone ?? p.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
