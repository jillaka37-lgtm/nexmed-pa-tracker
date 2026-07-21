import { runAgentJSON } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "../company";
import { lessonsBlockFor } from "../lessons";
import { reviewSchema, REVIEW_SHAPE_HINT, type Brief, type Review } from "../types";

/** Quality gate — below this score, the draft goes back to the writer. */
export const APPROVE_THRESHOLD = 75;

/**
 * Generator/Critic pattern: writer and editor are deliberately separate
 * agents. A model reviewing its own writing isn't a harsh critic
 * (self-evaluation bias); a separate editor with a numeric rubric is the
 * pipeline's actual quality gate.
 */
export async function editArticle(opts: { brief: Brief; draft: string }): Promise<Review> {
  const lessons = await lessonsBlockFor("editor");
  const system = `You are the senior editor for the NexMed blog — strict but fair. Your job is judging quality, not rewriting. Issues you raise must be specific enough that the writer knows exactly what to change and where.\n\n${COMPANY_PROFILE}${lessons}`;

  const prompt = `Article brief:
Title: ${opts.brief.title}
Audience: ${opts.brief.audience}
Primary keyword: ${opts.brief.primaryKeyword}
Target length: ${opts.brief.targetWordCount} words

— Draft —
${opts.draft}

Score the draft on this rubric (0-10 each):
- clarity: is every paragraph making one clear point?
- brandVoice: matches NexMed's warm, professional, no-hype tone?
- usefulness: does the reader know their "next step" after reading?
- structure: matches the brief, correct headings, has an intro and close?

score = sum of the four criteria × 2.5 (i.e. 0-100).
If score is below ${APPROVE_THRESHOLD}, set verdict to "revise" and list exactly what needs fixing in issues; otherwise "approve".`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: reviewSchema,
    shapeHint: REVIEW_SHAPE_HINT,
    temperature: 0.3,
    maxOutputTokens: 800,
  });
  return data;
}
