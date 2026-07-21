import { runAgentJSON } from "@/lib/ai-agents/core";
import { socialBriefSchema, SOCIAL_BRIEF_SHAPE_HINT, type BrandVoice, type SocialBrief, type SocialIdea } from "../types";

/**
 * Turns ideas into the shared SocialBrief contract every channel writer
 * consumes — this is the seam that lets ~60% of the code be reused when a
 * second channel (LinkedIn, reels) is added later, because their writers
 * consume the exact same brief shape.
 *
 * No source article exists here (unlike a "repurpose from blog post" mode),
 * so the model must never invent a statistic — proofPoint has to be a
 * concrete, recognizable situation, not a fabricated number.
 */
export async function buildCarouselBrief(opts: {
  brand: BrandVoice;
  ideas: SocialIdea[];
  topicHint: string | null;
}): Promise<SocialBrief> {
  const system = `You are the content strategist for NexMed's social content. You pick the best idea and turn it into a precise brief the copywriter can write directly from.

Brand voice: ${opts.brand.tone}
Audience: ${opts.brand.audience}

Rules:
- Pick the single best idea (not necessarily the highest score, if you have a better reason) and focus only on it — a brief blended from multiple ideas produces unfocused content.
- keyPoints must be claims, not headlines — each one should stand alone and make sense on its own.
- Never invent a number or statistic. proofPoint must be a concrete, recognizable situation (e.g. "someone who keeps missing refill windows because their schedule changes weekly"), not a fabricated statistic.
- hookAngle should name the reader's pain, not the topic.
- Write the brief platform-neutral — no "swipe" or platform-specific jargon.`;

  const ideasBlock = opts.ideas
    .map((idea, i) => `${i + 1}. "${idea.title}" (score ${idea.score})\n   hook: ${idea.hook}\n   pain point: ${idea.painPoint}\n   reason: ${idea.reason}`)
    .join("\n");
  const hint = opts.topicHint ? `\n\nStaff-suggested area: "${opts.topicHint}"` : "";

  const prompt = `Idea-scout's proposals:

${ideasBlock}${hint}

Pick one and write its social brief.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: socialBriefSchema,
    shapeHint: SOCIAL_BRIEF_SHAPE_HINT,
    temperature: 0.4,
    maxOutputTokens: 800,
  });
  return data;
}
