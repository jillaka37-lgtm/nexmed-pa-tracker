"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ContentStep } from "@/lib/content-studio/run-steps";

type RunRow = {
  id: string;
  kind: "linkedin" | "carousel";
  status: "running" | "done" | "error";
  steps: ContentStep[];
  piece_id: string | null;
  error: string | null;
};

const statusColor: Record<string, string> = { running: "text-teal", done: "text-health", error: "text-red-400" };

export function RunTimeline({ runId, initial }: { runId: string; initial: RunRow }) {
  const [run, setRun] = useState<RunRow>(initial);

  useEffect(() => {
    if (run.status !== "running") return;
    // Live-run polling, no websockets: every step the orchestrator writes
    // lands in the DB immediately, so a 2s poll is enough for a live feel.
    const timer = setInterval(async () => {
      const res = await fetch(`/api/content-studio/runs/${runId}`, { cache: "no-store" });
      if (res.ok) setRun(await res.json());
    }, 2000);
    return () => clearInterval(timer);
  }, [runId, run.status]);

  return (
    <div>
      {run.status === "error" && (
        <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
          Run failed: {run.error}
        </p>
      )}
      {run.status === "done" && run.piece_id && (
        <p className="mb-6 rounded-xl border border-health/30 bg-health/10 p-4 text-sm text-health">
          Done —{" "}
          <Link href="/admin/content-studio" className="underline">
            view it in the approval queue
          </Link>
          .
        </p>
      )}

      <ol className="space-y-2">
        {run.steps.map((s, i) => (
          <li key={i} className="rounded-xl border border-divider bg-card p-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${statusColor[s.status]}`}>
                {s.status === "running" ? "…" : s.status === "done" ? "✓" : "✗"}
              </span>
              <span className="text-sm text-offwhite">{s.label}</span>
            </div>
            {s.summary && <p className="mt-1 pl-6 text-xs text-muted">{s.summary}</p>}
          </li>
        ))}
        {run.steps.length === 0 && <p className="text-sm text-muted">Starting…</p>}
      </ol>
    </div>
  );
}
