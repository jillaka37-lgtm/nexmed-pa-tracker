"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { inputClass, Feedback, STATUS_STYLES } from "@/components/crm/ui";
import { convertLeadAction, setLeadStatusAction, type CrmState } from "@/app/crm/actions";
import type { Lead } from "@/lib/crm/types";

const initial: CrmState = { ok: false };

export function LeadRow({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [convertState, convertAction, convertPending] = useActionState(convertLeadAction, initial);
  const [statusState, statusAction] = useActionState(setLeadStatusAction, initial);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);

  async function handleScore() {
    setScoring(true);
    setScoreError(null);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/score`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setScoreError(data?.error ?? "Scoring failed.");
      } else {
        router.refresh();
      }
    } catch {
      setScoreError("Couldn't reach the server.");
    } finally {
      setScoring(false);
    }
  }

  return (
    <tr className="border-b border-divider align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-offwhite">{lead.name ?? "—"}</p>
        <p className="text-xs text-muted">{lead.email ?? lead.phone ?? "no contact info"}</p>
        {lead.message && <p className="mt-1 max-w-xs truncate text-xs text-muted">{lead.message}</p>}
      </td>
      <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted">{lead.source}</td>
      <td className="px-4 py-3">
        {lead.contactId ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES.converted}`}>converted</span>
        ) : (
          <form action={statusAction} className="flex items-center gap-2">
            <input type="hidden" name="lead_id" value={lead.id} />
            <select
              name="status"
              defaultValue={lead.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className={`${inputClass} h-8 w-32 py-1 text-xs`}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </select>
          </form>
        )}
        <Feedback state={statusState} />
      </td>
      <td className="px-4 py-3">
        {lead.aiScore !== null ? (
          <div>
            <span className="font-semibold text-offwhite">{lead.aiScore}/100</span>
            <p className="mt-0.5 max-w-[14rem] text-xs text-muted">{lead.aiScoreRationale}</p>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={handleScore} disabled={scoring}>
            {scoring ? "Scoring…" : "Score with AI"}
          </Button>
        )}
        {scoreError && <p className="mt-1 text-xs text-gold">{scoreError}</p>}
      </td>
      <td className="px-4 py-3">
        {lead.contactId ? (
          <span className="text-xs text-muted">already converted</span>
        ) : showConvert ? (
          <form action={convertAction} className="w-56 space-y-2">
            <input type="hidden" name="lead_id" value={lead.id} />
            <input name="company_name" placeholder="Company (optional)" className={`${inputClass} h-8 py-1 text-xs`} />
            <input name="deal_title" placeholder="Deal title (optional)" className={`${inputClass} h-8 py-1 text-xs`} />
            <input name="deal_amount" type="number" min="0" step="0.01" placeholder="Deal amount $" className={`${inputClass} h-8 py-1 text-xs`} />
            <Button type="submit" size="sm" disabled={convertPending}>
              {convertPending ? "Converting…" : "Convert"}
            </Button>
            <Feedback state={convertState} />
          </form>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowConvert(true)}>
            Convert to contact
          </Button>
        )}
      </td>
    </tr>
  );
}
