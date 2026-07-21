import { runAgentText } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "../company";
import { lessonsBlockFor } from "../lessons";
import type { Brief, Research, Review } from "../types";

/** The only agent with free-text output — its output is read by a human
 * (via the editor's judgment and eventually the reader), not parsed by the
 * next pipeline step, so it doesn't need a JSON contract. Two modes: write
 * (first draft from brief + research) and revise (based on editor issues). */

async function writerSystem(): Promise<string> {
  const lessons = await lessonsBlockFor("writer");
  return `You are the writer for the NexMed blog — a professional writer who writes natural, warm prose and avoids stiff, translated-sounding phrasing.\n\n${COMPANY_PROFILE}

Writing rules:
- Output pure Markdown only — no preamble or explanation before or after.
- The article starts with one H1 (#); sections are H2 (##).
- Short paragraphs (2-4 sentences). Use lists/bullets where appropriate.
- Only use facts from the research; never invent statistics.
- Never give a specific medical diagnosis or dosing instruction — frame clinical questions as "talk to your pharmacist/provider."${lessons}`;
}

function briefBlock(brief: Brief, research: Research): string {
  return `— Brief —
Title: ${brief.title}
Audience: ${brief.audience}
Primary keyword: ${brief.primaryKeyword} (work naturally into the title and first paragraph)
Secondary keywords: ${brief.secondaryKeywords.join(", ")}
Target length: about ${brief.targetWordCount} words
Outline:
${brief.outline.map((s) => `## ${s.heading}\n${s.points.map((p) => `   - ${p}`).join("\n")}`).join("\n")}
Closing CTA: ${brief.cta}

— Research —
Key facts:
${research.keyFacts.map((f) => `- ${f}`).join("\n")}
Examples:
${research.examples.map((e) => `- ${e}`).join("\n")}
Researcher's notes: ${research.angleNotes}`;
}

export async function writeArticle(opts: { brief: Brief; research: Research }): Promise<string> {
  const { text } = await runAgentText({
    model: process.env.WRITER_MODEL,
    system: await writerSystem(),
    prompt: `${briefBlock(opts.brief, opts.research)}\n\nNow write the complete article.`,
    temperature: 0.7,
    maxOutputTokens: 6000,
  });
  return text;
}

export async function reviseArticle(opts: { brief: Brief; research: Research; draft: string; review: Review }): Promise<string> {
  const { text } = await runAgentText({
    model: process.env.WRITER_MODEL,
    system: await writerSystem(),
    prompt: `${briefBlock(opts.brief, opts.research)}

— Current draft —
${opts.draft}

— Editor's issues (current score: ${opts.review.score}/100) —
${opts.review.issues.map((i) => `- ${i}`).join("\n")}

Rewrite the draft fixing exactly these issues. Keep what's working; only improve the problem areas. Output the complete, final article text.`,
    temperature: 0.5,
    maxOutputTokens: 6000,
  });
  return text;
}
