"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runEvaluation } from "@/lib/eval/runner";
import { suiteSchema, humanVerdictSchema } from "@/lib/eval/types";
import goldenSuite from "@/suites/nexmed-chatbot-golden.json";

export type EvalState = { ok: boolean; error?: string };

/**
 * Kicks off a run and returns immediately — the run itself takes minutes
 * (throttled calls + judge latency) and would exceed a normal request/
 * response cycle. after() lets it keep running server-side past the
 * redirect, the same pattern already used for judgeResponse() in
 * app/api/chat/route.ts.
 */
export async function startEvalRun(_prev: EvalState, formData: FormData): Promise<EvalState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const limitRaw = String(formData.get("limit") ?? "").trim();
  const limit = limitRaw ? Number(limitRaw) : undefined;

  const suite = suiteSchema.parse(goldenSuite);
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("eval_runs")
    .insert({ status: "running", suite_id: suite.id, progress: { done: 0, total: limit ?? suite.cases.length } })
    .select("id")
    .single();

  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runEvaluation({ runId: run.id, suite, limit });
    } catch (err) {
      await admin
        .from("eval_runs")
        .update({ status: "error", error: err instanceof Error ? err.message : String(err) })
        .eq("id", run.id);
    }
  });

  redirect(`/admin/eval/runs/${run.id}`);
}

/**
 * Records what a human thinks the correct verdict was for a case, next to
 * what the judge said. This is the raw material the "judge of judge"
 * (Cohen's kappa) page is built on — without it, every number in this
 * dashboard is a hypothesis about the judge's accuracy, not a fact.
 */
export async function submitHumanLabel(_prev: EvalState, formData: FormData): Promise<EvalState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const runId = String(formData.get("run_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const judgeVerdict = String(formData.get("judge_verdict") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const humanVerdictRaw = String(formData.get("human_verdict") ?? "");

  const parsed = humanVerdictSchema.safeParse(humanVerdictRaw);
  if (!runId || !caseId || !parsed.success) return { ok: false, error: "Invalid label." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("eval_human_labels")
    .upsert(
      { run_id: runId, case_id: caseId, human_verdict: parsed.data, judge_verdict: judgeVerdict, note },
      { onConflict: "run_id,case_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/eval/runs/${runId}`);
  revalidatePath("/admin/eval/judge");
  return { ok: true };
}
