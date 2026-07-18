import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { medications } from "@/lib/medications";

export const metadata: Metadata = { title: "My Medications" };

export default async function MedicationsPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescription_refills")
    .select("medication_name, dosage, current_pharmacy, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const seen = new Set<string>();
  const myMedications = (data ?? []).filter((r) => {
    const key = r.medication_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">My Medications</h1>
      <p className="mt-2 text-muted">Medications you&rsquo;ve requested refills for, with reference info where available.</p>

      <div className="mt-8 space-y-3">
        {myMedications.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-surface p-10 text-center">
            <p className="text-muted">Nothing here yet — medications you request refills for will show up here.</p>
            <ButtonLink href="/refill" size="lg" className="mt-6">Request a refill</ButtonLink>
          </div>
        ) : (
          myMedications.map((m) => {
            const ref = medications.find(
              (info) =>
                info.name.toLowerCase() === m.medication_name.toLowerCase() ||
                info.aliases.some((a) => a.toLowerCase() === m.medication_name.toLowerCase()),
            );
            return (
              <div key={m.medication_name} className="rounded-2xl border border-divider bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-offwhite">{m.medication_name}</p>
                    {m.dosage && <p className="mt-1 text-sm text-muted">{m.dosage}</p>}
                    {m.current_pharmacy && <p className="text-sm text-muted">Pharmacy on file: {m.current_pharmacy}</p>}
                  </div>
                  {ref && (
                    <Link href="/medication-info" className="shrink-0 text-sm text-teal hover:underline">
                      View reference info →
                    </Link>
                  )}
                </div>
                {ref && <p className="mt-3 border-t border-divider pt-3 text-sm text-muted">{ref.uses}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
