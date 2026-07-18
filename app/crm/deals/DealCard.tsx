"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/components/crm/ui";
import { moveDealStageAction } from "@/app/crm/actions";
import type { Deal, DealStage } from "@/lib/crm/types";

export function DealCard({
  deal,
  stages,
}: {
  deal: Deal & { contactName: string | null };
  stages: DealStage[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const daysInStage = useMemo(
    // eslint-disable-next-line react-hooks/purity -- intentional: recompute elapsed days each render
    () => Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / 86_400_000),
    [deal.stageEnteredAt],
  );

  async function handleMove(stageKey: string) {
    if (stageKey === deal.stageKey) return;
    const stage = stages.find((s) => s.key === stageKey);
    const lostReason = stage?.isLost ? window.prompt("Reason for losing this deal (optional):") ?? "" : "";

    setPending(true);
    const formData = new FormData();
    formData.set("deal_id", deal.id);
    formData.set("stage_key", stageKey);
    formData.set("lost_reason", lostReason);
    await moveDealStageAction({ ok: false }, formData);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-divider bg-navy p-3 text-sm">
      <p className="font-medium text-offwhite">{deal.title}</p>
      <p className="text-xs text-muted">{deal.contactName ?? "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold text-teal">{formatCents(deal.amountCents)}</span>
        <span className="text-xs text-muted">{daysInStage}d in stage</span>
      </div>
      <select
        value={deal.stageKey}
        disabled={pending}
        onChange={(e) => handleMove(e.target.value)}
        className="mt-2 w-full rounded-[6px] border border-divider bg-navy px-2 py-1 text-xs text-offwhite focus:border-teal focus:outline-none"
      >
        {stages.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
