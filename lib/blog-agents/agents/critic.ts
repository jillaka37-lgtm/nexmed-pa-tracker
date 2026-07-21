import { runAgentJSON } from "@/lib/ai-agents/core";
import { saveLessons } from "../lessons";
import { AGENT_IDS, criticOutputSchema, CRITIC_SHAPE_HINT, feedbackLessonsSchema, FEEDBACK_SHAPE_HINT, type Review } from "../types";
import type { SeoCheck } from "../seo-checks";
import type { BlogPost } from "../types";

/**
 * Self-improvement engine. Two inputs:
 * 1. After every pipeline run: reviews the whole process and extracts up to
 *    3 lessons, each addressed to a specific agent.
 * 2. Human feedback on a post: turned into an actionable lesson the same way.
 * Lessons are stored and lessons.ts injects them into that agent's prompt on
 * future runs — a closed learning loop with no fine-tuning and no code change.
 */
export async function critiqueRun(opts: {
  post: BlogPost;
  editorReview: Review;
  seoChecks: SeoCheck[];
  revisionRounds: number;
}): Promise<{ overallScore: number; strengths: string[]; weaknesses: string[]; lessonCount: number }> {
  const system = `You are the critic for the NexMed content pipeline. Your job is improving the SYSTEM, not this one article. You extract patterns from each run: what worked, what didn't, and what a specific agent should do differently next time.

System agents: ${AGENT_IDS.join(", ")}

Golden rule for a good lesson: short, actionable, and general (useful for all future articles, not just this one). Good example: "writer: open with a concrete reader problem instead of a generic statement." Bad example: "the article was good."`;

  const failedChecks = opts.seoChecks.filter((c) => !c.pass);

  const prompt = `Pipeline run report:

Final article: "${opts.post.title}"
Editor's final score: ${opts.editorReview.score}/100
Rubric detail: ${JSON.stringify(opts.editorReview.rubric)}
Revision rounds: ${opts.revisionRounds}
Editor's last-round issues:
${opts.editorReview.issues.map((i) => `- ${i}`).join("\n") || "- (none)"}
Failed SEO checks:
${failedChecks.map((c) => `- ${c.name}: ${c.note}`).join("\n") || "- (all passed)"}

Article text (for quality judgment):
${opts.post.contentMd.slice(0, 6000)}

Analyze this run and extract up to 3 lessons for future runs. If the system did great, give fewer lessons or none — a worthless lesson has a cost too.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: criticOutputSchema,
    shapeHint: CRITIC_SHAPE_HINT,
    temperature: 0.4,
    maxOutputTokens: 1000,
  });

  await saveLessons(data.lessons.map((l) => ({ agent: l.agent, lesson: l.lesson, source: "critic" as const })));

  return { overallScore: data.overallScore, strengths: data.strengths, weaknesses: data.weaknesses, lessonCount: data.lessons.length };
}

export async function distillFeedback(opts: { post: BlogPost; rating: 1 | -1; comment: string }): Promise<number> {
  // Unexplained positive feedback carries no lesson.
  if (opts.rating === 1 && !opts.comment.trim()) return 0;

  const system = `You are the critic for the NexMed content pipeline. You turn human feedback into actionable lessons for the agents.
System agents: ${AGENT_IDS.join(", ")}
If the feedback is too vague to produce a general lesson, return an empty array.`;

  const prompt = `Article: "${opts.post.title}"
Excerpt: ${opts.post.contentMd.slice(0, 2000)}

Human feedback:
Rating: ${opts.rating === 1 ? "👍 positive" : "👎 negative"}
Comment: ${opts.comment || "(none)"}

Extract up to 2 general, actionable lessons.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: feedbackLessonsSchema,
    shapeHint: FEEDBACK_SHAPE_HINT,
    temperature: 0.4,
    maxOutputTokens: 500,
  });

  await saveLessons(data.lessons.map((l) => ({ agent: l.agent, lesson: l.lesson, source: "human" as const })));
  return data.lessons.length;
}
