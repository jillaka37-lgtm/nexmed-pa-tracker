import { createAdminClient } from "@/lib/supabase/admin";
import type { StepId, PipelineStep } from "./types";
import { AGENT_LABELS } from "./types";

/**
 * Mirrors each step's status into blog_pipeline_runs.steps immediately, so
 * the studio's polling UI shows a live timeline without websockets — state
 * lives in the database, not in server memory. Must be a factory closing
 * over the specific run row (by id), not a shared/global array, or steps
 * from concurrent runs would bleed into each other.
 *
 * step() takes a function returning { output, summary } — a human-readable
 * one-liner distinct from the raw output — so the timeline shows something
 * like "3 ideas generated; best: 'X'" instead of a JSON blob.
 */
export function makeStepRunner(runId: string) {
  const steps: PipelineStep[] = [];

  async function persist() {
    const admin = createAdminClient();
    await admin.from("blog_pipeline_runs").update({ steps }).eq("id", runId);
  }

  async function step<T>(agent: StepId, fn: () => Promise<{ output: T; summary: string }>): Promise<T> {
    const entry: PipelineStep = {
      agent,
      label: AGENT_LABELS[agent],
      status: "running",
      startedAt: new Date().toISOString(),
    };
    steps.push(entry);
    await persist();

    try {
      const { output, summary } = await fn();
      entry.status = "done";
      entry.summary = summary;
      entry.finishedAt = new Date().toISOString();
      await persist();
      return output;
    } catch (err) {
      entry.status = "error";
      entry.summary = err instanceof Error ? err.message : String(err);
      entry.finishedAt = new Date().toISOString();
      await persist();
      throw err;
    }
  }

  return { step, steps };
}
