import { createAdminClient } from "@/lib/supabase/admin";

export type ContentStep = {
  agent: string;
  label: string;
  status: "running" | "done" | "error";
  summary?: string;
  startedAt: string;
  finishedAt?: string;
};

/**
 * Mirrors each step's status into content_studio_runs.steps immediately —
 * same pattern as lib/blog-agents/run-steps.ts. State lives in the
 * database, not server memory, so the client can poll a plain row instead
 * of needing websockets. Factory closes over one specific run id; a shared
 * module-level array would leak steps between concurrent runs.
 */
export function makeStepRunner(runId: string) {
  const steps: ContentStep[] = [];

  async function persist() {
    const admin = createAdminClient();
    await admin.from("content_studio_runs").update({ steps }).eq("id", runId);
  }

  async function step<T>(agent: string, label: string, fn: () => Promise<{ output: T; summary: string }>): Promise<T> {
    const entry: ContentStep = { agent, label, status: "running", startedAt: new Date().toISOString() };
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

  return { step };
}
