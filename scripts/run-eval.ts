/**
 * CLI entry point for the eval runner — imports the exact same
 * runEvaluation() the dashboard's "Run evaluation" button calls, so there is
 * no separate logic to keep in sync. Exists because evaluation needs to run
 * in CI, not just from a click in the browser.
 *
 * Usage:
 *   npx tsx scripts/run-eval.ts
 *   npx tsx scripts/run-eval.ts --limit 4
 *   npx tsx scripts/run-eval.ts --category "safety-manipulation"
 *   npx tsx scripts/run-eval.ts --label "after prompt fix"
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import type { CaseResult, RunSummary, Suite } from "../lib/eval/types";
import goldenSuite from "../suites/nexmed-chatbot-golden.json";

// Every lib/ import below reads process.env at module top-level (e.g.
// lib/supabase/env.ts's `const SUPABASE_URL = process.env...`). Static
// imports are hoisted in ESM and would evaluate before dotenv's config()
// call above runs, permanently capturing an empty env into those module
// singletons. Dynamic import() inside main() defers evaluation until after
// config() has already populated process.env — same fix already used by
// scripts/test-pa-isolation.ts.
async function loadDeps() {
  const [{ createClient }, { runEvaluation }, { suiteSchema }] = await Promise.all([
    import("@supabase/supabase-js"),
    import("../lib/eval/runner"),
    import("../lib/eval/types"),
  ]);
  return { createClient, runEvaluation, suiteSchema };
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const VERDICT_ICON: Record<string, string> = { pass: "✅", partial: "⚠️", fail: "❌" };

function toMarkdown(runId: string, summary: RunSummary, results: CaseResult[]): string {
  const lines = [
    `# Eval report — ${new Date().toISOString()}`,
    "",
    `Run: ${runId}`,
    "",
    "## Summary",
    "",
    `- Overall score: **${summary.overallScore}/100**`,
    `- Pass / Partial / Fail: ${summary.counts.pass} / ${summary.counts.partial} / ${summary.counts.fail}`,
    `- Dimensions — expectation ${summary.dimensions.expectation.toFixed(2)}, faithfulness ${summary.dimensions.faithfulness.toFixed(2)}, safety ${summary.dimensions.safety.toFixed(2)}, brand voice ${summary.dimensions.brandVoice.toFixed(2)} (out of 10)`,
    `- Avg latency: ${summary.latency.avgMs}ms (p95: ${summary.latency.p95Ms}ms)`,
    `- Judge cost: $${summary.judgeCostUsd} (${summary.judgeTokens} tokens)`,
    `- Knowledge gaps: ${summary.knowledgeGaps}`,
    "",
    "## By category",
    "",
    "| Category | Score | ✅ | ⚠️ | ❌ |",
    "|---|---|---|---|---|",
    ...summary.byCategory.map((c) => `| ${c.category} | ${Math.round(c.score)} | ${c.pass} | ${c.partial} | ${c.fail} |`),
    "",
    "## Cases needing attention",
    "",
    ...results
      .filter((r) => r.verdict !== "pass")
      .map((r) => `### ${r.caseId} — ${r.category} (${r.verdict})\n\n**Q:** ${r.question}\n\n**A:** ${r.answer || "(empty)"}\n\n**Judge:** ${r.expectation?.reasoning ?? r.error ?? "(no judge reasoning)"}\n`),
    "",
    "## All cases",
    "",
    "| ID | Category | Verdict | Score |",
    "|---|---|---|---|",
    ...results.map((r) => `| ${r.caseId} | ${r.category} | ${VERDICT_ICON[r.verdict]} ${r.verdict} | ${Math.round(r.finalScore)} |`),
  ];
  return lines.join("\n");
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required.");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required — the runner persists progress to eval_runs.");
  }

  const { createClient, runEvaluation, suiteSchema } = await loadDeps();

  const limitRaw = argValue("--limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const category = argValue("--category");
  const label = argValue("--label") ?? null;

  const suite: Suite = suiteSchema.parse(goldenSuite);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const total = limit ?? (category ? suite.cases.filter((c) => c.category === category).length : suite.cases.length);
  const { data: run, error } = await supabase
    .from("eval_runs")
    .insert({ status: "running", suite_id: suite.id, label, progress: { done: 0, total } })
    .select("id")
    .single();
  if (error || !run) throw new Error(error?.message ?? "Failed to create run row.");

  console.log(`Running ${total} case(s)${category ? ` in category "${category}"` : ""}...\n`);

  await runEvaluation({
    runId: run.id,
    suite,
    limit,
    categories: category ? [category] : undefined,
    onCaseComplete: (result, done, runTotal) => {
      console.log(`[${done}/${runTotal}] ${VERDICT_ICON[result.verdict]} ${String(Math.round(result.finalScore)).padStart(3)}  ${result.caseId}   ${result.question.slice(0, 60)}`);
    },
  });

  const { data: finished } = await supabase.from("eval_runs").select("summary, results").eq("id", run.id).single();
  const summary = finished!.summary as RunSummary;
  const results = finished!.results as CaseResult[];

  console.log(`\nOverall score: ${summary.overallScore}/100`);

  const reportsDir = resolve(__dirname, "../reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const jsonPath = resolve(reportsDir, `run-${stamp}.json`);
  const mdPath = resolve(reportsDir, `run-${stamp}.md`);

  writeFileSync(jsonPath, JSON.stringify({ runId: run.id, summary, results }, null, 2));
  writeFileSync(mdPath, toMarkdown(run.id, summary, results));

  console.log(`📄 ${jsonPath}`);
  console.log(`📄 ${mdPath}`);
}

main().catch((err) => {
  console.error("Eval run failed:", err);
  process.exit(1);
});
