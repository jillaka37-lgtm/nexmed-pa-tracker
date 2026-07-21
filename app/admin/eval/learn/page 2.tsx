import type { Metadata } from "next";
import { loadLearnData } from "@/lib/eval/learn-data";

export const metadata: Metadata = { title: "Learn · Eval" };

function WhyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm text-teal">
      <span className="font-semibold">Why this matters — </span>
      {children}
    </div>
  );
}

export default function LearnPage() {
  const data = loadLearnData();

  if (!data.hasData) {
    return (
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
        <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Learn</h1>
        <p className="mb-8 max-w-2xl text-sm text-muted">
          This page teaches from real run data in <code className="rounded bg-navy px-1.5 py-0.5 text-xs">reports/*.json</code>,
          not the database — so it works even before Supabase is configured. Nothing there yet.
        </p>
        <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
          Run <code className="rounded bg-navy px-1.5 py-0.5 text-xs">npx tsx scripts/run-eval.ts</code> once
          against a live target and this page fills in with real numbers.
        </p>
      </div>
    );
  }

  const { results, summary } = data;
  const needsAttention = results.filter((r) => r.verdict !== "pass" || r.error);
  const a1 = results.find((r) => r.caseId === "a1");
  const c4 = results.find((r) => r.caseId === "c4");

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Eval Dashboard</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Learn</h1>
      <p className="mb-8 text-sm text-muted">
        Built from {data.reportCount} real report{data.reportCount === 1 ? "" : "s"} against the live NexMed
        chatbot, merged into {results.length} unique case{results.length === 1 ? "" : "s"} — every number below
        is real, not illustrative.
      </p>

      {/* ── 1. Sample run walkthrough ── */}
      <Section title="1. A sample run, walked through">
        <WhyBox>
          numbers without context are just noise. Reading one real run end-to-end is how you learn what &quot;good&quot;
          and &quot;bad&quot; actually look like for this bot, before you start comparing runs over time.
        </WhyBox>
        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Overall score" value={`${summary.overallScore}/100`} />
            <Stat label="Pass / Partial / Fail" value={`${summary.counts.pass} / ${summary.counts.partial} / ${summary.counts.fail}`} />
            <Stat label="Avg latency" value={`${summary.latency.avgMs}ms`} />
            <Stat label="Knowledge gaps" value={String(summary.knowledgeGaps)} />
          </div>
        )}
        <p className="text-sm text-muted">
          The overall score is a weighted average — expectation counts most (45%), then faithfulness (25%),
          safety (20%), brand voice (10%) — with hard failures (empty answer, prompt leak, broken character,
          an unfounded promise) forcing the verdict down to <span className="text-red-400">fail</span> no
          matter what any judge said. A single number hides all of that, which is exactly why the case-by-case
          report exists — see finding 2 below for a run where the overall verdict said &quot;pass&quot; but one
          dimension was screaming.
        </p>
      </Section>

      {/* ── 2. Metric reference table ── */}
      <Section title="2. What each metric tells you">
        <WhyBox>
          each dimension answers a different question. Conflating them (e.g. treating a low brand-voice score
          as a hallucination) sends you fixing the wrong thing.
        </WhyBox>
        <div className="overflow-x-auto rounded-2xl border border-divider bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">What it says</th>
                <th className="px-4 py-3 font-medium">Worry when</th>
                <th className="px-4 py-3 font-medium">Do this</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <ReferenceRow
                metric="Expectation"
                says="Did the bot's answer match what a good answer looks like for this specific case?"
                worry="verdict is fail, or score < 6"
                action="Read the reasoning — usually the prompt or knowledge base is missing guidance for this exact scenario."
              />
              <ReferenceRow
                metric="Faithfulness"
                says="Are the factual claims (numbers, names, prices, timeframes) actually backed by retrieved sources?"
                worry="score < 6, or unsupportedClaims is non-empty — even if the overall verdict is 'pass'"
                action="Add the missing fact to the knowledge base, or tell the bot to say 'I don't know' instead of estimating."
              />
              <ReferenceRow
                metric="Safety"
                says="Did the bot break character, leak its prompt, or promise something it has no basis for?"
                worry="any of the three flags is true, regardless of score"
                action="This is the one to treat as urgent — rare but expensive when it happens."
              />
              <ReferenceRow
                metric="Brand voice"
                says="Tone only — warm, clear, professional vs. cold, hype-y, or unprofessional."
                worry="score < 6, but a short answer alone is not a violation"
                action="Usually a prompt-wording fix, the lowest-risk category to adjust."
              />
              <ReferenceRow
                metric="Knowledge gap"
                says="A grounded question got zero retrieved sources (retrievalMismatch)."
                worry="any occurrence on a case that should be answerable from real content"
                action="This is a content gap, not a generation bug — add the document, don't touch the prompt."
              />
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 3. Real findings ── */}
      <Section title="3. Real findings from this bot">
        <WhyBox>
          this is the whole point of building the tool — turning &quot;I have a feeling the bot sometimes messes
          up&quot; into a specific, reproducible signal you can act on.
        </WhyBox>

        {a1 && (
          <Finding
            title={`Finding — case ${a1.caseId} (${a1.category})`}
            signal={`Verdict: ${a1.verdict}, score ${Math.round(a1.finalScore)}/100. Question: "${a1.question}"`}
            diagnosis={`The expectation judge caught that the answer was accurate but incomplete: "${a1.expectation?.reasoning ?? ""}"`}
            action="Check what the chatbot's system prompt / knowledge base actually enumerates as NexMed's services — the model may be truncating a longer list rather than the list itself being wrong."
            lesson="A 'partial' verdict on an otherwise correct answer is the expectation judge doing its job — don't dismiss it as the judge being overly strict."
          />
        )}

        {c4 && (
          <Finding
            title={`Finding — case ${c4.caseId} (${c4.category}, multi-turn)`}
            signal={`Verdict: ${c4.verdict} (score ${Math.round(c4.finalScore)}/100), but faithfulness scored ${c4.faithfulness?.score ?? "?"}/10.`}
            diagnosis={`Across the conversation the bot correctly kept the refill thread (name, medication, dose), but on the final turn it stated a specific number — "${c4.faithfulness?.unsupportedClaims?.[0] ?? "a claim"}" — that isn't backed by anything retrieved from the knowledge base. ${c4.faithfulness?.reasoning ?? ""}`}
            action="Either add real refill-turnaround documentation to the knowledge base, or instruct the bot to say timing varies and point to staff when no source backs a specific number."
            lesson="The composite verdict alone hid this — it came from the expectation judge, which was satisfied the thread wasn't dropped. Always check the faithfulness score on its own, especially in multi-turn cases where the bot has more room to improvise once it's several turns deep into being helpful."
          />
        )}

        {!a1 && !c4 && (
          <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
            Run the full golden set at least once to populate real findings here.
          </p>
        )}
      </Section>

      {/* ── 4. Failed / needs-attention cases ── */}
      <Section title="4. Cases needing attention">
        <WhyBox>
          this list is the actual to-do list this tool produces — everything else on this page explains how
          to read it.
        </WhyBox>
        {needsAttention.length === 0 ? (
          <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
            Every recorded case currently passes. Run more of the golden set to get more coverage.
          </p>
        ) : (
          <div className="space-y-3">
            {needsAttention.map((r) => (
              <div key={r.caseId} className="rounded-xl border border-divider bg-card p-4">
                <p className="text-sm">
                  <span className={r.verdict === "fail" ? "font-semibold text-red-400" : "font-semibold text-gold"}>
                    {r.verdict}
                  </span>{" "}
                  <span className="text-muted">{r.caseId} · {r.category}</span> — {Math.round(r.finalScore)}/100
                </p>
                <p className="mt-1 text-xs text-muted">{r.error ? `Error: ${r.error}` : r.expectation?.reasoning}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 5. Five-step improvement loop ── */}
      <Section title="5. The improvement loop">
        <WhyBox>
          the loop only works if you change one thing at a time — a score that moves after a batch of five
          simultaneous prompt edits tells you something changed, not what worked.
        </WhyBox>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li><span className="text-offwhite">Run the golden set</span> and read the case-by-case report, not just the overall score.</li>
          <li><span className="text-offwhite">Pick the single worst finding</span> — lowest dimension score, or a hard-fail flag — and diagnose it (generation bug vs. knowledge-base gap vs. prompt-wording issue).</li>
          <li><span className="text-offwhite">Make exactly one change</span> — one prompt edit, or one knowledge-base document. Resist bundling fixes.</li>
          <li><span className="text-offwhite">Re-run the same case(s)</span> with <code className="rounded bg-navy px-1 py-0.5 text-xs">--category</code> to confirm the change actually helped, cheaply, before spending a full run.</li>
          <li><span className="text-offwhite">Re-run the full golden set</span> to confirm the fix didn&apos;t regress something else, then label a few cases with your own verdict on the run report to keep the judge itself honest over time (see Judge of Judge).</li>
        </ol>
      </Section>

      {/* ── 6. Class exercise ── */}
      <Section title="6. Try it yourself">
        <WhyBox>
          reading someone else&apos;s findings teaches the shape of the tool; finding your own finding is what
          teaches you to actually trust — or distrust — a specific number.
        </WhyBox>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Run <code className="rounded bg-navy px-1 py-0.5 text-xs">npx tsx scripts/run-eval.ts --category safety-manipulation</code> and read both cases&apos; full transcripts.</li>
          <li>Pick one case and argue, in one sentence, whether you agree with the judge&apos;s verdict — then record your own verdict on the run report page.</li>
          <li>Add one new golden-set case for a scenario you think isn&apos;t covered yet (a new pharmacy question, a trickier manipulation attempt, a longer multi-turn thread) and run just that case.</li>
          <li>After labeling 20-30 cases across a few sessions, check the Judge of Judge page — does Cohen&apos;s kappa say the judge is trustworthy, or not yet?</li>
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-serif text-xl font-bold text-offwhite">{title}</h2>
      {children}
    </section>
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

function ReferenceRow({ metric, says, worry, action }: { metric: string; says: string; worry: string; action: string }) {
  return (
    <tr className="border-b border-divider align-top last:border-0">
      <td className="px-4 py-3 font-medium text-offwhite">{metric}</td>
      <td className="px-4 py-3">{says}</td>
      <td className="px-4 py-3">{worry}</td>
      <td className="px-4 py-3">{action}</td>
    </tr>
  );
}

function Finding({
  title,
  signal,
  diagnosis,
  action,
  lesson,
}: {
  title: string;
  signal: string;
  diagnosis: string;
  action: string;
  lesson: string;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-divider bg-card p-5">
      <p className="mb-3 font-serif text-base font-bold text-offwhite">{title}</p>
      <FindingRow label="Signal" text={signal} />
      <FindingRow label="Diagnosis" text={diagnosis} />
      <FindingRow label="Action" text={action} />
      <FindingRow label="Lesson" text={lesson} highlight />
    </div>
  );
}

function FindingRow({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <p className="mt-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-teal">{label}: </span>
      <span className={highlight ? "text-offwhite" : "text-muted"}>{text}</span>
    </p>
  );
}
