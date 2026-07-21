import { runAgentJSON } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "../company";
import { lessonsBlockFor } from "../lessons";
import { briefSchema, BRIEF_SHAPE_HINT, type Brief, type Idea } from "../types";

/**
 * Turns the best idea into an executable content brief — the document the
 * writer and SEO agent both work from: precise audience, primary keyword,
 * outline, and CTA. Separating "what to write" (strategist) from "writing
 * it" (writer) is the same reason a real editorial team drafts a brief
 * before anyone starts writing.
 */
export async function buildBrief(opts: { ideas: Idea[]; topicHint: string | null }): Promise<Brief> {
  const lessons = await lessonsBlockFor("strategist");
  const system = `You are the content strategist for the NexMed blog. You pick the best idea from the scout's list and turn it into an executable brief.\n\n${COMPANY_PROFILE}${lessons}`;

  const ideasText = opts.ideas
    .map((idea, i) => `${i + 1}. "${idea.title}" (score ${idea.score}/10)\n   angle: ${idea.angle}\n   search intent: ${idea.searchIntent}`)
    .join("\n");

  const prompt = `Idea-scout's proposals (sorted by score):

${ideasText}

Pick the best one — not necessarily #1, use your own judgment — and build a full content brief:
- Sharpen the final title if needed (compelling, not clickbait).
- Primary keyword must be a phrase people actually search for.
- Outline needs 4-7 sections, the last one leading naturally into a booking/refill CTA.
- Target length 900-1500 words.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: briefSchema,
    shapeHint: BRIEF_SHAPE_HINT,
    temperature: 0.5,
    maxOutputTokens: 1500,
  });
  return data;
}
