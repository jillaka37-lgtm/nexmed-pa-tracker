import { runAgentJSON } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "@/lib/blog-agents/company";
import { ideaScoutOutputSchema, IDEA_SHAPE_HINT, type Idea } from "@/lib/blog-agents/types";

/**
 * Same idea-scout pattern already proven in Blog Agents, reused here so
 * Content Studio doesn't require staff to always supply a topic by hand.
 * Only runs when the brief's topics field is left blank — an explicit
 * topic from a human always wins over a model-generated one.
 */
export async function scoutLinkedinIdea(opts: { existingHooks: string[] }): Promise<Idea> {
  const system = `You are the idea-scout for NexMed's LinkedIn presence.\n\n${COMPANY_PROFILE}`;

  const prompt = `Recent post hooks (do not repeat these or anything too similar):
${opts.existingHooks.length ? opts.existingHooks.map((h) => `- ${h}`).join("\n") : "(none yet)"}

No topic was given — propose at least 3 LinkedIn post ideas useful for NexMed patients or local healthcare partners, each with a title, a specific angle, the search/scroll intent, a score 0-10 for fit, and a one-sentence reason.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: ideaScoutOutputSchema,
    shapeHint: IDEA_SHAPE_HINT,
    temperature: 0.8,
    maxOutputTokens: 1200,
  });

  return [...data.ideas].sort((a, b) => b.score - a.score)[0];
}
