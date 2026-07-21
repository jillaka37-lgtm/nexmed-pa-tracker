import { runAgentJSON } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "../company";
import { lessonsBlockFor } from "../lessons";
import { ideaScoutOutputSchema, IDEA_SHAPE_HINT, type Idea } from "../types";

export async function scoutIdeas(opts: { existingTitles: string[]; topicHint: string | null }): Promise<Idea[]> {
  const lessons = await lessonsBlockFor("idea-scout");
  const system = `You are the idea-scout for the NexMed blog.\n\n${COMPANY_PROFILE}${lessons}`;

  const prompt = `Existing post titles (do not repeat these or anything too similar):
${opts.existingTitles.length ? opts.existingTitles.map((t) => `- ${t}`).join("\n") : "(none yet)"}

${opts.topicHint ? `Topic hint from staff: ${opts.topicHint}` : "No topic hint given — pick something useful for NexMed patients."}

Propose at least 3 blog post ideas. For each: a title, a specific angle, the search intent a reader would have when looking this up, a score 0-10 for how well it fits NexMed's audience and business goal (driving bookings/refills), and a one-sentence reason.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: ideaScoutOutputSchema,
    shapeHint: IDEA_SHAPE_HINT,
    temperature: 0.8,
    maxOutputTokens: 1500,
  });
  return data.ideas;
}
