import { createAdminClient } from "@/lib/supabase/admin";
import { sendToNexmedChat, type TargetResponse } from "./targets/nexmed-chat";
import { runChecks } from "./checks";
import { judgeExpectation, judgeFaithfulness, judgeSafety, judgeBrandVoice } from "./rubrics";
import { computeFinalScore, summarize } from "./scoring";
import { estimateCostForModel } from "./pricing";
import type { CaseResult, EvalCase, Suite } from "./types";

/**
 * Runs every turn of a case sequentially against the same conversation
 * (reusing sessionId so the bot keeps its context), and returns the final
 * turn's response plus the full transcript. A single-turn case is just a
 * one-element version of the same path — no separate code path needed.
 */
async function runTurns(testCase: EvalCase): Promise<{
  final: TargetResponse;
  lastUserMessage: string;
  transcript: { user: string; bot: string }[];
  priorContext: string;
}> {
  const turns = testCase.turns ?? [{ user: testCase.message! }];
  let sessionId: string | null = null;
  const transcript: { user: string; bot: string }[] = [];
  let final: TargetResponse = { text: "", latencyMs: 0, ragHit: null, sources: [], sourceText: "" };

  for (const turn of turns) {
    const res = await sendToNexmedChat(turn.user, sessionId);
    sessionId = res.sessionId;
    final = res;
    transcript.push({ user: turn.user, bot: res.text });
    if (res.error) break; // a mid-thread failure still needs to be reported, not silently skipped
  }

  const priorContext =
    transcript.length > 1
      ? `\n\nPRIOR CONVERSATION (the bot already saw this; judge whether it kept the thread):\n${transcript
          .slice(0, -1)
          .map((t, i) => `Turn ${i + 1} — User: ${t.user}\nBot: ${t.bot}`)
          .join("\n\n")}`
      : "";

  return { final, lastUserMessage: turns[turns.length - 1].user, transcript, priorContext };
}

const JUDGE_MODEL = process.env.JUDGE_MODEL || "google/gemini-2.5-flash";

/**
 * Pure orchestration code, not an agent — case order, throttling, and
 * scoring must be deterministic and debuggable. Only the four judge calls
 * inside each case are delegated to an LLM, and they run in parallel so
 * running four judges instead of one doesn't add latency.
 */
export async function runEvaluation(opts: {
  runId: string;
  suite: Suite;
  limit?: number;
  categories?: string[];
  onCaseComplete?: (result: CaseResult, done: number, total: number) => void;
}): Promise<void> {
  const admin = createAdminClient();
  let cases = opts.categories?.length ? opts.suite.cases.filter((c) => opts.categories!.includes(c.category)) : opts.suite.cases;
  if (opts.limit) cases = cases.slice(0, opts.limit);
  const results: CaseResult[] = [];
  let judgeCostUsd = 0;
  let judgeTokens = 0;

  const emptyChecks = {
    empty: true,
    charCount: 0,
    wordCount: 0,
    exclamationCount: 0,
    bannedPhrase: null,
    promptLeakSuspected: false,
    sourceCount: 0,
    maxSimilarity: null,
    retrievalMismatch: false,
  } as const;

  for (const testCase of cases) {
    let result: CaseResult;
    try {
      const { final: target, lastUserMessage, transcript, priorContext } = await runTurns(testCase);

      if (target.error) {
        result = {
          caseId: testCase.id,
          category: testCase.category,
          question: lastUserMessage,
          answer: "",
          transcript,
          latencyMs: target.latencyMs,
          ragHit: null,
          sources: [],
          checks: emptyChecks,
          expectation: null,
          faithfulness: null,
          safety: null,
          brandVoice: null,
          finalScore: 0,
          verdict: "fail",
          weight: testCase.weight,
          error: target.error,
        };
      } else {
        const checks = runChecks({
          answer: target.text,
          ragHit: target.ragHit,
          sources: target.sources,
          groundedExpected: testCase.groundedExpected,
        });

        // Never spend judge calls on an answer that's already a hard
        // failure — an empty response can't be scored for anything, and
        // skipping saves cost on cases we already know failed.
        let expectation = null, faithfulness = null, safety = null, brandVoice = null;
        if (!checks.empty) {
          const [expRes, faithRes, safeRes, voiceRes] = await Promise.all([
            judgeExpectation({ testCase, question: lastUserMessage, answer: target.text, priorContext }),
            judgeFaithfulness({ testCase, question: lastUserMessage, answer: target.text, sources: target.sources, sourceText: target.sourceText, priorContext }),
            judgeSafety({ testCase, question: lastUserMessage, answer: target.text, priorContext }),
            judgeBrandVoice({ answer: target.text }),
          ]);
          expectation = expRes.data;
          faithfulness = faithRes.data;
          safety = safeRes.data;
          brandVoice = voiceRes.data;

          for (const { usage } of [expRes, faithRes, safeRes, voiceRes]) {
            judgeCostUsd += estimateCostForModel(JUDGE_MODEL, usage.inputTokens, usage.outputTokens);
            judgeTokens += usage.inputTokens + usage.outputTokens;
          }
        }

        const { score, verdict } = computeFinalScore(checks, { expectation, faithfulness, safety, brandVoice });

        result = {
          caseId: testCase.id,
          category: testCase.category,
          question: lastUserMessage,
          answer: target.text,
          transcript,
          latencyMs: target.latencyMs,
          ragHit: target.ragHit,
          sources: target.sources,
          checks,
          expectation,
          faithfulness,
          safety,
          brandVoice,
          finalScore: score,
          verdict,
          weight: testCase.weight,
        };
      }
    } catch (err) {
      // One case failing must never abort the run — a partial report beats
      // no report.
      result = {
        caseId: testCase.id,
        category: testCase.category,
        question: testCase.message ?? testCase.turns?.[testCase.turns.length - 1]?.user ?? "",
        answer: "",
        transcript: [],
        latencyMs: 0,
        ragHit: null,
        sources: [],
        checks: emptyChecks,
        expectation: null,
        faithfulness: null,
        safety: null,
        brandVoice: null,
        finalScore: 0,
        verdict: "fail",
        weight: testCase.weight,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    results.push(result);
    // Persist after every case so the dashboard can show live progress via
    // polling — no websockets needed.
    await admin
      .from("eval_runs")
      .update({ results, progress: { done: results.length, total: cases.length } })
      .eq("id", opts.runId);
    opts.onCaseComplete?.(result, results.length, cases.length);
  }

  const summary = summarize(results);
  summary.judgeCostUsd = Math.round(judgeCostUsd * 10000) / 10000;
  summary.judgeTokens = judgeTokens;

  await admin
    .from("eval_runs")
    .update({ status: "done", results, summary, finished_at: new Date().toISOString() })
    .eq("id", opts.runId);
}
