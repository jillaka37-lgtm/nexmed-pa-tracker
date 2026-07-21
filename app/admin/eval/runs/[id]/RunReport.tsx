"use client";

import { useEffect, useState } from "react";
import type { CaseResult, RunSummary } from "@/lib/eval/types";
import { HumanLabelForm } from "./HumanLabelForm";

type RunRow = {
  id: string;
  status: "running" | "done" | "error";
  progress: { done: number; total: number };
  results: CaseResult[];
  summary: RunSummary | null;
  error: string | null;
};

const verdictColor: Record<string, string> = { pass: "text-health", partial: "text-gold", fail: "text-red-400" };

export function RunReport({ runId, initial }: { runId: string; initial: RunRow }) {
  const [run, setRun] = useState<RunRow>(initial);

  useEffect(() => {
    if (run.status !== "running") return;
    // Live-run polling, no websockets: every step the runner writes lands
    // in the DB immediately, so a 2s poll is enough for a "live" feel.
    const timer = setInterval(async () => {
      const res = await fetch(`/api/eval/runs/${runId}`, { cache: "no-store" });
      if (res.ok) setRun(await res.json());
    }, 2000);
    return () => clearInterval(timer);
  }, [runId, run.status]);

  return (
    <div>
      {run.status === "running" && (
        <p className="mb-6 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm text-teal">
          Running… {run.progress.done}/{run.progress.total} cases done.
        </p>
      )}
      {run.status === "error" && (
        <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
          Run failed: {run.error}
        </p>
      )}

      {run.summary && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Overall score" value={`${run.summary.overallScore}/100`} />
          <Stat label="Pass / Partial / Fail" value={`${run.summary.counts.pass} / ${run.summary.counts.partial} / ${run.summary.counts.fail}`} />
          <Stat label="Avg latency" value={`${run.summary.latency.avgMs}ms`} />
          <Stat label="Knowledge gaps" value={String(run.summary.knowledgeGaps)} />
          <Stat label="Expectation (avg/10)" value={run.summary.dimensions.expectation.toFixed(1)} />
          <Stat label="Faithfulness (avg/10)" value={run.summary.dimensions.faithfulness.toFixed(1)} />
          <Stat label="Safety (avg/10)" value={run.summary.dimensions.safety.toFixed(1)} />
          <Stat label="Brand voice (avg/10)" value={run.summary.dimensions.brandVoice.toFixed(1)} />
        </div>
      )}

      <div className="space-y-4">
        {run.results.map((r) => (
          <details key={r.caseId} className="rounded-2xl border border-divider bg-card p-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm text-offwhite">
                <span className={`font-semibold ${verdictColor[r.verdict]}`}>{r.verdict}</span>
                {"  "}
                <span className="text-muted">{r.category}</span> — {r.question}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted">{Math.round(r.finalScore)}</span>
            </summary>

            <div className="mt-4 space-y-4 text-sm">
              {r.error && <p className="text-gold">Error: {r.error}</p>}
              {r.transcript && r.transcript.length > 1 ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Transcript ({r.transcript.length} turns)</p>
                  <div className="mt-1 space-y-2">
                    {r.transcript.map((t, i) => (
                      <div key={i} className="rounded-lg border border-divider bg-navy p-2">
                        <p className="text-xs font-semibold text-teal">User</p>
                        <p className="text-offwhite">{t.user}</p>
                        <p className="mt-1.5 text-xs font-semibold text-teal">Bot</p>
                        <p className="whitespace-pre-wrap text-offwhite">{t.bot || "(empty)"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Answer</p>
                  <p className="whitespace-pre-wrap text-offwhite">{r.answer || "(empty)"}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <JudgeCard label="Expectation" score={r.expectation?.score} reasoning={r.expectation?.reasoning} extra={r.expectation ? [`verdict: ${r.expectation.verdict}`] : []} />
                <JudgeCard
                  label="Faithfulness"
                  score={r.faithfulness?.score}
                  reasoning={r.faithfulness?.reasoning}
                  extra={r.faithfulness?.unsupportedClaims.length ? [`unsupported: ${r.faithfulness.unsupportedClaims.join("; ")}`] : []}
                />
                <JudgeCard
                  label="Safety"
                  score={r.safety?.score}
                  reasoning={r.safety?.reasoning}
                  extra={[
                    r.safety?.brokeCharacter ? "broke character" : null,
                    r.safety?.leakedPrompt ? "leaked prompt" : null,
                    r.safety?.unfoundedCommitment ? "unfounded commitment" : null,
                  ].filter((x): x is string => !!x)}
                />
                <JudgeCard label="Brand voice" score={r.brandVoice?.score} reasoning={r.brandVoice?.reasoning} extra={r.brandVoice?.violations ?? []} />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {r.checks.empty && <Chip label="empty response" />}
                {r.checks.bannedPhrase && <Chip label={`banned phrase: ${r.checks.bannedPhrase}`} />}
                {r.checks.promptLeakSuspected && <Chip label="possible prompt leak" />}
                {r.checks.exclamationCount > 2 && <Chip label={`${r.checks.exclamationCount} exclamation marks`} />}
                {r.checks.retrievalMismatch && <Chip label="knowledge gap: expected grounded answer, no source retrieved" />}
                {r.ragHit != null && <Chip label={`rag hit: ${r.ragHit}`} />}
              </div>

              {r.sources.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Retrieved sources</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {r.sources.map((s, i) => (
                      <Chip key={i} label={`${s.title} (${s.similarity.toFixed(2)})`} />
                    ))}
                  </div>
                </div>
              )}

              {run.status === "done" && <HumanLabelForm runId={runId} caseId={r.caseId} judgeVerdict={r.verdict} />}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-offwhite">{value}</p>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full border border-divider px-2 py-0.5 text-muted">{label}</span>;
}

function JudgeCard({ label, score, reasoning, extra }: { label: string; score?: number; reasoning?: string; extra: string[] }) {
  if (score == null) return null;
  return (
    <div className="rounded-xl border border-divider bg-navy p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">{label}</p>
        <p className="text-sm font-bold tabular-nums text-offwhite">{score}/10</p>
      </div>
      {reasoning && <p className="mt-1 text-xs text-muted">{reasoning}</p>}
      {extra.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-xs text-gold">
          {extra.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
