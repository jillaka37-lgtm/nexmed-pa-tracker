import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Refill Requests" };

const STATUS_STYLES: Record<string, string> = {
  received: "bg-divider text-muted",
  processing: "bg-sky/15 text-sky",
  ready: "bg-health/15 text-health",
  completed: "bg-teal/15 text-teal",
  cancelled: "bg-red-500/15 text-red-400",
};

type Refill = {
  id: string;
  medication_name: string;
  dosage: string | null;
  fulfilment: string;
  status: string;
  created_at: string;
};

export default async function RefillsPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescription_refills")
    .select("id, medication_name, dosage, fulfilment, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const refills = (data ?? []) as Refill[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-offwhite">Refill Requests</h1>
          <p className="mt-2 text-muted">Track the status of your prescription refill requests.</p>
        </div>
        <ButtonLink href="/refill" size="sm">Request a refill</ButtonLink>
      </div>

      <div className="mt-8 space-y-3">
        {refills.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-surface p-10 text-center">
            <p className="text-muted">No refill requests yet.</p>
            <ButtonLink href="/refill" size="lg" className="mt-6">Request a refill</ButtonLink>
          </div>
        ) : (
          refills.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-divider bg-surface p-5">
              <div>
                <p className="font-semibold text-offwhite">{r.medication_name}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.dosage ? `${r.dosage} · ` : ""}
                  {r.fulfilment === "delivery" ? "Delivery" : "Pickup"} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[r.status] ?? "bg-divider text-muted"}`}>
                {r.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
