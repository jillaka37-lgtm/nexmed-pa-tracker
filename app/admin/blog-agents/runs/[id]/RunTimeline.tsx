"use client";

import { useEffect, useState } from "react";
import type { PipelineStep } from "@/lib/blog-agents/types";

type RunRow = {
  id: string;
  status: "running" | "done" | "error";
  steps: PipelineStep[];
  post_id: string | null;
  error: string | null;
};

const statusColor: Record<string, string> = {
  running: "text-teal",
  done: "text-health",
  error: "text-red-400",
};

export function RunTimeline({ runId, initial }: { runId: string; initial: RunRow }) {
  const [run, setRun] = useState<RunRow>(initial);

  useEffect(() => {
    if (run.status !== "running") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/blog-agents/runs/${runId}`, { cache: "no-store" });
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
      {run.status === "done" && run.post_id && (
        <p className="mb-6 rounded-xl border border-health/30 bg-health/10 p-4 text-sm text-health">
          Done. See the post in the Posts list below.
        </p>
      )}

      <ol className="space-y-2">
        {run.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-divider bg-card p-3">
            <span className={`text-sm font-semibold ${statusColor[s.status]}`}>{s.status === "running" ? "…" : s.status === "done" ? "✓" : "✗"}</span>
            <span className="text-sm text-offwhite">{s.label}</span>
            {s.summary && <span className="truncate text-xs text-muted">— {s.summary}</span>}
          </li>
        ))}
        {run.steps.length === 0 && <p className="text-sm text-muted">Starting…</p>}
      </ol>
    </div>
  );
}
