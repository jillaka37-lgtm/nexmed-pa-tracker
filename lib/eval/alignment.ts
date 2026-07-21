import { createAdminClient } from "@/lib/supabase/admin";
import type { JudgeAlignment } from "./types";

const VERDICTS = ["pass", "partial", "fail"] as const;

/**
 * Agreement rate alone is misleading: if 90% of cases pass, a judge that
 * blindly says "pass" every time gets 90% agreement without understanding
 * anything. Cohen's kappa corrects for that by subtracting the agreement
 * you'd expect from chance alone.
 *
 * κ = (observed agreement − chance agreement) / (1 − chance agreement)
 *
 * Interpretation: <0.4 poor (don't trust the judge), 0.4-0.6 moderate,
 * 0.6-0.8 good, >0.8 excellent.
 */
export function computeAlignment(
  labels: { humanVerdict: string; judgeVerdict: string }[],
): JudgeAlignment {
  const matrix: Record<string, Record<string, number>> = {};
  for (const h of VERDICTS) {
    matrix[h] = {};
    for (const j of VERDICTS) matrix[h][j] = 0;
  }

  for (const label of labels) {
    if (matrix[label.humanVerdict] && label.judgeVerdict in matrix[label.humanVerdict]) {
      matrix[label.humanVerdict][label.judgeVerdict]++;
    }
  }

  const total = labels.length;
  if (total === 0) {
    return { total: 0, agreed: 0, agreementRate: 0, matrix, cohensKappa: 0 };
  }

  const agreed = VERDICTS.reduce((s, v) => s + matrix[v][v], 0);
  const agreementRate = agreed / total;

  const humanMarginal = Object.fromEntries(VERDICTS.map((v) => [v, VERDICTS.reduce((s, j) => s + matrix[v][j], 0) / total]));
  const judgeMarginal = Object.fromEntries(VERDICTS.map((v) => [v, VERDICTS.reduce((s, h) => s + matrix[h][v], 0) / total]));
  const chanceAgreement = VERDICTS.reduce((s, v) => s + humanMarginal[v] * judgeMarginal[v], 0);

  const cohensKappa = chanceAgreement >= 1 ? 0 : (agreementRate - chanceAgreement) / (1 - chanceAgreement);

  return { total, agreed, agreementRate, matrix, cohensKappa: Math.round(cohensKappa * 1000) / 1000 };
}

export async function getAllHumanLabels(): Promise<{ humanVerdict: string; judgeVerdict: string }[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("eval_human_labels").select("human_verdict, judge_verdict");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ humanVerdict: r.human_verdict, judgeVerdict: r.judge_verdict }));
}
