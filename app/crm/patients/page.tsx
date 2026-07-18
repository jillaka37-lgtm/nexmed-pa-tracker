import type { Metadata } from "next";
import Link from "next/link";
import { listPatients } from "@/lib/crm/patients";

export const metadata: Metadata = { title: "Patients · CRM" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await listPatients(q);

  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Care Coordination</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Patients</h1>
      <p className="mb-8 text-muted">Every registered patient account. Click through for their full profile and history.</p>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-sm rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
        />
      </form>

      {patients.length === 0 ? (
        <p className="text-muted">No patients yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-divider hover:bg-navy/50">
                  <td className="px-4 py-3">
                    <Link href={`/crm/patients/${p.id}`} className="font-medium text-teal hover:underline">
                      {p.fullName || p.email || p.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.email ?? p.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
