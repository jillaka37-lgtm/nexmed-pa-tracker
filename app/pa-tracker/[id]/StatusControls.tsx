"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PaStatus } from "@/lib/pa-tracker/schema";

const STATUSES: PaStatus[] = ["new", "sent", "waiting", "approved", "denied"];

export function StatusControls({ caseId, status }: { caseId: string; status: PaStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: PaStatus) {
    if (next === status) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/pa-tracker/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't update status.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === status ? "primary" : "outline"}
            disabled={pending}
            onClick={() => setStatus(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-gold">{error}</p>}
    </div>
  );
}
