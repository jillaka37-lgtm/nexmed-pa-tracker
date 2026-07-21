import { runAgentJSON } from "@/lib/ai-agents/core";
import { socialIdeaScoutOutputSchema, SOCIAL_IDEA_SHAPE_HINT, type BrandVoice, type SocialIdea } from "../types";

/**
 * Sibling to the blog idea-scout, not a parameterized version of it — a
 * good SEO idea and a good feed idea are different things. Nobody searches
 * for a carousel topic; it has to stop the scroll on its own.
 */
export async function scoutCarouselIdeas(opts: {
  brand: BrandVoice;
  topicHint: string | null;
  existingTitles: string[];
}): Promise<SocialIdea[]> {
  const system = `You are the social-content idea scout for NexMed, a pharmacy/health brand.

Brand voice: ${opts.brand.tone}
Audience: ${opts.brand.audience}

Key difference from search-driven content: nobody is scrolling their feed looking for you. The idea has to stop the scroll itself — challenge a common assumption, name a common mistake, or state something the reader doesn't expect. Neutral, generic-educational titles ("A guide to medication management") are dead on the feed.`;

  const existing = opts.existingTitles.length
    ? `\n\nPrevious social content (don't repeat these or anything too similar):\n${opts.existingTitles.map((t) => `- ${t}`).join("\n")}`
    : "";
  const hint = opts.topicHint ? `\n\nStaff suggested this area — ideas should relate to it: "${opts.topicHint}"` : "";

  const prompt = `Propose 5 Instagram carousel ideas for NexMed.

Score each 0-10 on:
- Does the hook actually stop the scroll, or is it just a polite title?
- Does it hit a real, specific pain point for a NexMed patient?
- Does it connect to NexMed's actual services?
- Is it a fresh angle, or a repeat of something everyone already says?${existing}${hint}`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: socialIdeaScoutOutputSchema,
    shapeHint: SOCIAL_IDEA_SHAPE_HINT,
    temperature: 0.9,
    maxOutputTokens: 1200,
  });

  return [...data.ideas].sort((a, b) => b.score - a.score);
}
