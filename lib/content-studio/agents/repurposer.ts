import { runAgentJSON } from "@/lib/ai-agents/core";
import { socialBriefSchema, SOCIAL_BRIEF_SHAPE_HINT, type BrandVoice, type SocialBrief } from "../types";
import type { BlogPost } from "@/lib/blog-agents/types";

/**
 * From a published article, builds the one social brief both the carousel
 * and LinkedIn writers work from. Why a shared brief instead of each
 * copywriter reading the article directly? Content atomization means "one
 * message, different clothes" — if each writer picked its own angle
 * independently, they'd produce two unrelated pieces. Same role the
 * strategist plays in the blog pipeline.
 */
export async function repurposeArticle(opts: { brand: BrandVoice; post: BlogPost }): Promise<SocialBrief> {
  const system = `You are the content repurposer for NexMed. Your job is pulling the one idea out of a long article that survives on a social feed.

Brand voice: ${opts.brand.tone}
Audience: ${opts.brand.audience}

Strict rules:
- Do NOT summarize the article. A summary of a 1000-word article makes boring feed content. Pick one idea that's worth stopping the scroll on its own.
- keyPoints must be claims, not headlines — each should stand alone. "3 pricing mistakes" is a headline; "most businesses price from cost, not the value they create" is a claim.
- proofPoint must come only from this article. Never invent a number, statistic, or example not present in the source.
- hookAngle should name the reader's pain, not the article's topic.
- Write the brief platform-neutral — no "swipe" or platform-specific jargon; the copywriters put the clothes on.`;

  const prompt = `Source article:

Title: ${opts.post.title}
Excerpt: ${opts.post.excerpt ?? "(none)"}

Article text:
${opts.post.contentMd.slice(0, 8000)}

Build a social brief.`;

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
