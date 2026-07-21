import { z } from "zod";

// A single user turn in a multi-turn case. `expect` is optional per-turn
// color (e.g. "should ask for the caller's name here") — the case's overall
// `expected`/`failureSignal` still judge the final answer, since that's
// where a lost thread (dropped booking flow, forgotten context) shows up.
export const evalTurnSchema = z.object({ user: z.string(), expect: z.string().optional() });
export type EvalTurn = z.infer<typeof evalTurnSchema>;

export const evalCaseSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    // Single-turn cases use `message`; multi-turn cases use `turns` instead
    // (e.g. booking flow: request -> give details -> ask a side question,
    // to check the bot doesn't lose the thread). Exactly one must be set.
    message: z.string().optional(),
    turns: z.array(evalTurnSchema).min(2).optional(),
    expected: z.string(),
    failureSignal: z.string(),
    // false for anti-hallucination cases where *not* retrieving a source is
    // the correct behavior — matching that pattern to a "grounded" answer
    // would penalize the bot for correctly saying "I don't know."
    groundedExpected: z.boolean(),
    weight: z.number().min(0).max(5).default(1),
  })
  .refine((c) => !!c.message !== !!c.turns, { message: "case must set exactly one of message or turns" });
export type EvalCase = z.infer<typeof evalCaseSchema>;

export const suiteSchema = z.object({
  id: z.string(),
  title: z.string(),
  cases: z.array(evalCaseSchema),
});
export type Suite = z.infer<typeof suiteSchema>;

export const expectationVerdictSchema = z.object({
  verdict: z.enum(["pass", "partial", "fail"]),
  score: z.number().min(0).max(10),
  reasoning: z.string(),
});
export type ExpectationVerdict = z.infer<typeof expectationVerdictSchema>;
export const EXPECTATION_SHAPE_HINT = `{"verdict":"pass|partial|fail","score":0,"reasoning":"..."}`;

export const faithfulnessVerdictSchema = z.object({
  score: z.number().min(0).max(10),
  unsupportedClaims: z.array(z.string()),
  admittedUncertainty: z.boolean(),
  reasoning: z.string(),
});
export type FaithfulnessVerdict = z.infer<typeof faithfulnessVerdictSchema>;
export const FAITHFULNESS_SHAPE_HINT = `{"score":0,"unsupportedClaims":["..."],"admittedUncertainty":false,"reasoning":"..."}`;

export const safetyVerdictSchema = z.object({
  score: z.number().min(0).max(10),
  brokeCharacter: z.boolean(),
  leakedPrompt: z.boolean(),
  unfoundedCommitment: z.boolean(),
  reasoning: z.string(),
});
export type SafetyVerdict = z.infer<typeof safetyVerdictSchema>;
export const SAFETY_SHAPE_HINT = `{"score":0,"brokeCharacter":false,"leakedPrompt":false,"unfoundedCommitment":false,"reasoning":"..."}`;

export const brandVoiceVerdictSchema = z.object({
  score: z.number().min(0).max(10),
  violations: z.array(z.string()),
  reasoning: z.string(),
});
export type BrandVoiceVerdict = z.infer<typeof brandVoiceVerdictSchema>;
export const BRAND_VOICE_SHAPE_HINT = `{"score":0,"violations":["..."],"reasoning":"..."}`;

export type RetrievedSource = { title: string; similarity: number };

export type DeterministicChecks = {
  empty: boolean;
  charCount: number;
  wordCount: number;
  exclamationCount: number;
  bannedPhrase: string | null;
  promptLeakSuspected: boolean;
  sourceCount: number;
  maxSimilarity: number | null;
  retrievalMismatch: boolean;
};

export type CaseResult = {
  caseId: string;
  category: string;
  // For a single-turn case, `question`/`answer` are the whole exchange. For
  // a multi-turn case they're the *last* user turn and the bot's final
  // answer (what checks/judges score); `transcript` carries every turn so
  // the report can show the full thread, not just the ending.
  question: string;
  answer: string;
  transcript: { user: string; bot: string }[];
  latencyMs: number;
  ragHit: boolean | null;
  sources: RetrievedSource[];
  checks: DeterministicChecks;
  expectation: ExpectationVerdict | null;
  faithfulness: FaithfulnessVerdict | null;
  safety: SafetyVerdict | null;
  brandVoice: BrandVoiceVerdict | null;
  finalScore: number;
  verdict: "pass" | "partial" | "fail";
  weight: number;
  error?: string;
};

export type RunSummary = {
  overallScore: number;
  counts: { pass: number; partial: number; fail: number };
  byCategory: { category: string; score: number; pass: number; partial: number; fail: number }[];
  dimensions: { expectation: number; faithfulness: number; safety: number; brandVoice: number };
  latency: { avgMs: number; p95Ms: number };
  judgeCostUsd: number;
  judgeTokens: number;
  knowledgeGaps: number;
};

export const humanVerdictSchema = z.enum(["pass", "partial", "fail"]);

export type HumanLabel = {
  id: string;
  runId: string;
  caseId: string;
  humanVerdict: "pass" | "partial" | "fail";
  judgeVerdict: "pass" | "partial" | "fail";
  note: string | null;
  createdAt: string;
};

export type JudgeAlignment = {
  total: number;
  agreed: number;
  agreementRate: number;
  matrix: Record<string, Record<string, number>>;
  cohensKappa: number;
};
