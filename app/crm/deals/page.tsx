import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listDeals, listDealStages } from "@/lib/crm/deals";
import { formatCents } from "@/components/crm/ui";
import { DealCard } from "./DealCard";

export const metadata: Metadata = { title: "Deals · CRM" };

export default async function DealsPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/crm/deals");
  if (!(await isAdmin())) redirect("/login?redirect=/crm/deals");

  const [deals, stages] = await Promise.all([listDeals(), listDealStages()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-serif text-3xl font-bold text-offwhite">Deals</h1>
      <p className="mb-8 text-muted">Move a deal to a new stage from its card. Add new deals from a contact&apos;s page.</p>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-6">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageKey === stage.key);
          const total = stageDeals.reduce((sum, d) => sum + d.amountCents, 0);
          return (
            <div key={stage.key} className="min-w-[220px] rounded-2xl border border-divider bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-offwhite">{stage.label}</h2>
                <span className="text-xs text-muted">{stageDeals.length}</span>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} stages={stages} />
                ))}
                {stageDeals.length === 0 && <p className="text-xs text-muted">No deals</p>}
              </div>
              <p className="mt-3 border-t border-divider pt-2 text-xs font-medium text-muted">
                {formatCents(total)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
