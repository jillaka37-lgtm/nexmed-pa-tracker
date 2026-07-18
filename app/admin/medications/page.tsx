import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Medication Management · Staff" };

type Refill = {
  user_id: string | null;
  full_name: string;
  medication_name: string;
  dosage: string | null;
  status: string;
  created_at: string;
};

export default async function MedicationManagementPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("prescription_refills")
    .select("user_id, full_name, medication_name, dosage, status, created_at")
    .order("created_at", { ascending: false });

  const refills = (data ?? []) as Refill[];

  const byMedication = new Map<string, Refill[]>();
  for (const r of refills) {
    const key = r.medication_name.toLowerCase();
    if (!byMedication.has(key)) byMedication.set(key, []);
    byMedication.get(key)!.push(r);
  }

  const medications = [...byMedication.entries()]
    .map(([key, entries]) => ({ name: entries[0].medication_name, entries, patientCount: new Set(entries.map((e) => e.user_id ?? e.full_name)).size }))
    .sort((a, b) => b.entries.length - a.entries.length);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Medication Management</h1>
      <p className="mb-8 text-muted">A registry of medications requested across all patients, drawn from refill requests.</p>

      {medications.length === 0 ? (
        <p className="text-muted">No medication data yet.</p>
      ) : (
        <div className="space-y-4">
          {medications.map((m) => (
            <div key={m.name} className="rounded-2xl border border-divider bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-offwhite">{m.name}</h2>
                <span className="text-xs text-muted">{m.patientCount} patient{m.patientCount === 1 ? "" : "s"}</span>
              </div>
              <ul className="space-y-1 text-sm">
                {m.entries.slice(0, 8).map((e, i) => (
                  <li key={i} className="flex items-center justify-between text-muted">
                    <span>
                      {e.user_id ? (
                        <Link href={`/crm/patients/${e.user_id}`} className="text-teal hover:underline">{e.full_name}</Link>
                      ) : (
                        e.full_name
                      )}
                      {e.dosage ? ` — ${e.dosage}` : ""}
                    </span>
                    <span className="text-xs capitalize">{e.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
