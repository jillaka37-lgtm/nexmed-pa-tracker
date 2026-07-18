import type { Metadata } from "next";
import { listPharmacyContacts } from "@/lib/crm/pharmacyContacts";
import { PharmacyContactForm } from "./PharmacyContactForm";

export const metadata: Metadata = { title: "Pharmacy Contacts · CRM" };

export default async function PharmacyContactsPage() {
  const contacts = await listPharmacyContacts();

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Pharmacy Contacts</h1>
      <p className="mb-8 text-muted">Other pharmacies, reps, and industry contacts.</p>

      <div className="mb-10 rounded-2xl border border-divider bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-offwhite">Add contact</h2>
        <PharmacyContactForm />
      </div>

      {contacts.length === 0 ? (
        <p className="text-muted">No contacts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-divider">
                  <td className="px-4 py-3 text-offwhite">{c.fullName}</td>
                  <td className="px-4 py-3 text-muted">{c.roleTitle ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.organization ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.phone ?? c.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
