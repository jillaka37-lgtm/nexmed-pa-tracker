import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { summarize } from "./scoring";
import type { CaseResult, RunSummary } from "./types";

type StoredRun = { runId: string; summary: RunSummary; results: CaseResult[] };

/**
 * Reads from reports/*.json on disk, not the database — the /learn page is
 * meant to show a real, walkable example to someone who just cloned the
 * repo and hasn't run anything against a live Supabase project yet. As long
 * as `npx tsx scripts/run-eval.ts` has been run at least once, this page has
 * real content.
 */
function loadAllReports(): StoredRun[] {
  const dir = resolve(process.cwd(), "reports");
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  // Filenames are `run-<ISO timestamp with :/. replaced by ->.json`, so a
  // plain sort is already chronological — oldest first, latest last.
  files.sort();
  const runs: StoredRun[] = [];
  for (const f of files) {
    try {
      runs.push(JSON.parse(readFileSync(resolve(dir, f), "utf8")) as StoredRun);
    } catch {
      // A corrupt/partial report file must not take down the whole page.
    }
  }
  return runs;
}

export type LearnData = {
  hasData: boolean;
  reportCount: number;
  latestRunId: string | null;
  results: CaseResult[];
  summary: RunSummary | null;
  cumulativeJudgeCostUsd: number;
};

/**
 * Merges every case across every report file, keeping the latest occurrence
 * of each case id — later runs are assumed to be re-checks of the same
 * case, not duplicates to average together. The merged set is then re-run
 * through the real summarize() the dashboard uses, so this page's numbers
 * are computed the same way as everywhere else, not a separate approximation.
 */
export function loadLearnData(): LearnData {
  const runs = loadAllReports();
  const merged = new Map<string, CaseResult>();
  for (const run of runs) {
    for (const result of run.results) merged.set(result.caseId, result);
  }
  const results = [...merged.values()];

  return {
    hasData: results.length > 0,
    reportCount: runs.length,
    latestRunId: runs.length ? runs[runs.length - 1].runId : null,
    results,
    summary: results.length ? summarize(results) : null,
    cumulativeJudgeCostUsd: runs.reduce((s, r) => s + (r.summary.judgeCostUsd ?? 0), 0),
  };
}
