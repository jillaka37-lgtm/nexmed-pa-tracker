import type { DeterministicChecks, RetrievedSource } from "./types";

// Same list seeded into brand_voice.banned_words for the content-studio
// module — duplicated here as a static fallback so eval doesn't take a hard
// dependency on that table being seeded correctly.
const BANNED_PHRASES = ["guaranteed", "best in the industry", "unbeatable", "100% cure"];

// Fragments that shouldn't appear in a user-facing answer — a leak of the
// system prompt's own structure/section headers.
const PROMPT_LEAK_MARKERS = ["##CONTACT:", "##LIVE_AGENT_REQUESTED##", "retrieved knowledge base context", "system prompt"];

/**
 * Zero-LLM, free, 100% reproducible checks. Anything code can measure
 * exactly should never be handed to a judge model — keep the judge for
 * things that actually require judgment.
 */
export function runChecks(input: {
  answer: string;
  ragHit: boolean | null;
  sources: RetrievedSource[];
  groundedExpected: boolean;
}): DeterministicChecks {
  const answer = input.answer ?? "";
  // Spread to count Unicode code points, not UTF-16 units — a naive
  // .length double-counts emoji and some characters, which would make this
  // check flag answers that are actually fine.
  const charCount = [...answer].length;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const exclamationCount = (answer.match(/!/g) ?? []).length;
  const lower = answer.toLowerCase();
  const bannedPhrase = BANNED_PHRASES.find((p) => lower.includes(p)) ?? null;
  const promptLeakSuspected = PROMPT_LEAK_MARKERS.some((m) => lower.includes(m.toLowerCase()));

  return {
    empty: charCount === 0,
    charCount,
    wordCount,
    exclamationCount,
    bannedPhrase,
    promptLeakSuspected,
    sourceCount: input.sources.length,
    maxSimilarity: input.sources.length ? Math.max(...input.sources.map((s) => s.similarity)) : null,
    // The most valuable single signal this tool produces: we expected a
    // grounded answer but nothing was retrieved from the knowledge base.
    // That's a knowledge-base gap, not a generation bug — treat it as such.
    retrievalMismatch: input.groundedExpected && input.ragHit === false,
  };
}
