import type { Slide } from "./types";

/**
 * Deterministic social-content checks — no LLM, for the same reason as
 * seo-checks.ts: caption length, slide count, hashtag format, and link
 * presence are all mechanical rules. Keep the model for judgment (tone,
 * hook quality) and count things with code — cheaper and 100% reliable.
 */
export type SocialCheck = { name: string; pass: boolean; note: string };

const URL_RE = /(https?:\/\/|www\.)/i;
const HASHTAG_RE = /^#[^\s#]+$/;

/** Spreads to iterate code points, not UTF-16 units — str.length counts an
 * emoji as 2 and would reject an otherwise-fine caption. */
function charCount(s: string): number {
  return [...s].length;
}

function lines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

function paragraphs(s: string): string[] {
  return s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * "Hook" = the first sentence, not the first line. Hit this exact bug in
 * the reference implementation: measuring "first line" scored a caption
 * written as one unbroken block at its full 472 characters, when the real
 * first sentence was a perfectly fine 44 characters. Cut at the first line
 * break OR the first sentence-ending punctuation, whichever comes first.
 */
function firstSentence(s: string): string {
  const firstLine = lines(s)[0] ?? "";
  const m = firstLine.match(/^[\s\S]*?[?!.]/);
  return (m ? m[0] : firstLine).trim();
}

export function runInstagramChecks(input: { caption: string; slides: Slide[]; hashtags: string[] }): SocialCheck[] {
  const { caption, slides, hashtags } = input;
  const checks: SocialCheck[] = [];

  const hook = firstSentence(caption);
  const hookLen = charCount(hook);
  checks.push({
    name: "hook in first 125 chars",
    pass: hookLen > 0 && hookLen <= 125,
    note: hookLen === 0 ? "caption is empty" : `"${hook.slice(0, 40)}…" — ${hookLen} chars (cap 125)`,
  });

  checks.push({
    name: "slide count",
    pass: slides.length >= 5 && slides.length <= 8,
    note: `${slides.length} slides (want 5-8)`,
  });

  const longSlide = slides.findIndex((s) => charCount(s.heading) > 40 || charCount(s.text) > 140);
  checks.push({
    name: "slide text length",
    pass: longSlide === -1,
    note: longSlide === -1 ? "all slides readable at thumbnail size" : `slide ${longSlide + 1} is too long (heading ≤40, text ≤140)`,
  });

  // Deliberately no "does the last slide have a call to action" check —
  // that's a judgment call, not a mechanical rule (keyword matching would
  // reject a perfectly clear CTA that just doesn't use an expected word).
  // Left to the social editor's platformFit rubric instead.

  checks.push({
    name: "hashtag count",
    pass: hashtags.length >= 8 && hashtags.length <= 15,
    note: `${hashtags.length} hashtags (want 8-15)`,
  });

  const badTags = hashtags.filter((h) => !HASHTAG_RE.test(h));
  const hasDupes = new Set(hashtags).size !== hashtags.length;
  checks.push({
    name: "hashtag format",
    pass: badTags.length === 0 && !hasDupes,
    note: badTags.length > 0 ? `invalid: ${badTags.join(", ")}` : hasDupes ? "duplicate hashtag present" : "all hashtags valid and unique",
  });

  const hasUrl = URL_RE.test(caption);
  checks.push({
    name: "no link in caption",
    pass: !hasUrl,
    note: hasUrl ? "Instagram doesn't make caption links clickable — use \"link in bio\" instead" : "no link in caption",
  });

  const capLen = charCount(caption);
  checks.push({
    name: "caption length",
    pass: capLen >= 150 && capLen <= 2200,
    note: `${capLen} chars (want 150-2200)`,
  });

  return checks;
}

export function runLinkedinChecks(input: { body: string; hashtags: string[] }): SocialCheck[] {
  const { body, hashtags } = input;
  const checks: SocialCheck[] = [];

  // LinkedIn shows about three rendered lines (~210 chars) before "see
  // more". Since the writer separates paragraphs with a blank line, the
  // first paragraph is effectively what's shown — measure that, not "the
  // first three non-empty lines" (which, when the writer wrote one
  // unbroken block, meant three full paragraphs and always failed).
  const hookPara = paragraphs(body)[0] ?? "";
  const hookLen = charCount(hookPara);
  checks.push({
    name: "three-line hook",
    pass: hookLen > 0 && hookLen <= 210,
    note: hookLen === 0 ? "body is empty" : `${hookLen} chars before "see more" (cap 210)`,
  });

  const bodyLen = charCount(body);
  checks.push({ name: "post length", pass: bodyLen >= 900 && bodyLen <= 1800, note: `${bodyLen} chars (want 900-1800)` });

  const hasUrl = URL_RE.test(body);
  checks.push({
    name: "no link in body",
    pass: !hasUrl,
    note: hasUrl ? "put the link in the first comment, not the post body — outbound links reduce reach" : "no link in the post body",
  });

  const paras = paragraphs(body);
  const longest = paras.reduce((m, p) => Math.max(m, charCount(p)), 0);
  checks.push({ name: "short paragraphs", pass: longest <= 320, note: `longest paragraph ${longest} chars (cap 320)` });

  checks.push({ name: "paragraph spacing", pass: paras.length >= 4, note: `${paras.length} paragraphs (min 4 — a wall of text doesn't get read in-feed)` });

  // LinkedIn doesn't render markdown — asterisks/hashes show up raw.
  // Deliberately only flag * and # (not dashes, which have legitimate uses
  // and would false-positive) — a wrong check is worse than no check.
  const md = body.match(/^\s*(\*+|#+)\s/m) || body.match(/\*\*[^*]+\*\*/);
  checks.push({
    name: "no markdown formatting",
    pass: !md,
    note: md ? `"${md[0].trim()}" — LinkedIn doesn't render markdown, it shows up raw` : "no markdown formatting",
  });

  const badTags = hashtags.filter((h) => !HASHTAG_RE.test(h));
  checks.push({
    name: "hashtag count",
    pass: hashtags.length >= 3 && hashtags.length <= 5 && badTags.length === 0,
    note: badTags.length > 0 ? `invalid: ${badTags.join(", ")}` : `${hashtags.length} hashtags (want 3-5)`,
  });

  // Ends with a discussion question — ignore a trailing hashtag-only line.
  const meaningful = paras.filter((p) => !p.split(/\s+/).every((w) => w.startsWith("#")));
  const lastPara = meaningful[meaningful.length - 1] ?? "";
  const endsWithQuestion = /[?]\s*$/.test(lastPara);
  checks.push({
    name: "ends with a discussion prompt",
    pass: endsWithQuestion,
    note: endsWithQuestion ? "post ends with a question" : "post doesn't end with a question — won't spark comments",
  });

  return checks;
}

/** ~140 words per minute of spoken Persian/English narration. */
const WORDS_PER_MINUTE = 140;

export function runReelsChecks(input: {
  hook: string;
  body: string;
  cta: string;
  ctaId: string;
  onScreenText: string;
  hashtags: string[];
  /** Allowed ids, from the reels-cta list. */
  allowedCtaIds: string[];
}): SocialCheck[] {
  const { hook, body, cta, onScreenText, hashtags } = input;
  const checks: SocialCheck[] = [];

  const script = `${hook}\n\n${body}\n\n${cta}`;
  const words = wordCount(script);
  const seconds = Math.round((words / WORDS_PER_MINUTE) * 60);

  checks.push({ name: "script length cap", pass: words <= 400, note: `${words} words ≈ ${seconds}s (cap 400 words / 3 min)` });

  // Deliberately open up to 300, not a tighter cap — dense content is
  // allowed to run longer, and a stricter check would trigger pointless
  // revisions.
  checks.push({ name: "reels sweet spot", pass: words >= 100 && words <= 300, note: `${words} words ≈ ${seconds}s (want 100-300 words)` });

  const hookWords = wordCount(hook);
  checks.push({ name: "short hook", pass: hookWords > 0 && hookWords <= 20, note: `${hookWords} words ≈ ${Math.round((hookWords / WORDS_PER_MINUTE) * 60)}s (cap 20 words)` });

  const OPENERS = ["hi", "hello", "hey", "so,", "so ", "in this video", "today we're"];
  const opener = OPENERS.find((o) => hook.trim().toLowerCase().startsWith(o));
  checks.push({
    name: "no throat-clearing in hook",
    pass: !opener,
    note: opener ? `hook opens with "${opener.trim()}"` : "hook goes straight to the point",
  });

  // Only flag square brackets — not used in normal spoken script text, so
  // no false positives, unlike parentheses which appear in normal sentences.
  const stageDir = script.match(/\[[^\]]*\]/);
  checks.push({
    name: "no stage directions",
    pass: !stageDir,
    note: stageDir ? `stage direction in script: "${stageDir[0].slice(0, 40)}"` : "script only contains what's spoken",
  });

  const ctaOk = input.allowedCtaIds.includes(input.ctaId);
  checks.push({
    name: "CTA from allowed list",
    pass: ctaOk,
    note: ctaOk ? `chosen CTA: ${input.ctaId}` : `"${input.ctaId}" isn't in the allowed list (${input.allowedCtaIds.join(", ")})`,
  });

  const onScreenLen = charCount(onScreenText);
  checks.push({ name: "on-screen text length", pass: onScreenLen > 0 && onScreenLen <= 45, note: `${onScreenLen} chars (cap 45 — must be readable at a glance on video)` });

  const badTags = hashtags.filter((h) => !HASHTAG_RE.test(h));
  checks.push({
    name: "hashtag count",
    pass: hashtags.length >= 3 && hashtags.length <= 5 && badTags.length === 0,
    note: badTags.length > 0 ? `invalid: ${badTags.join(", ")}` : `${hashtags.length} hashtags (want 3-5)`,
  });

  return checks;
}
