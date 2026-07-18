import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { RefillStatusForm } from "./RefillStatusForm";

export const metadata: Metadata = { title: "Refill Requests · Staff" };

export default async function StaffRefillsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("prescription_refills")
    .select("id, full_name, email, phone, medication_name, dosage, fulfilment, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const refills = data ?? [];

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Refill Requests</h1>
      <p className="mb-8 text-muted">Every prescription refill request. Update status as you process each one.</p>

      {refills.length === 0 ? (
        <p className="text-muted">No refill requests yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Medication</th>
                <th className="px-4 py-3 font-medium">Fulfilment</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {refills.map((r) => (
                <tr key={r.id} className="border-b border-divider">
                  <td className="px-4 py-3">
                    <p className="text-offwhite">{r.full_name}</p>
                    <p className="text-xs text-muted">{r.email} {r.phone ? `· ${r.phone}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.medication_name}{r.dosage ? ` (${r.dosage})` : ""}</td>
                  <td className="px-4 py-3 text-muted capitalize">{r.fulfilment}</td>
                  <td className="px-4 py-3 text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <RefillStatusForm id={r.id} status={r.status} />
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
