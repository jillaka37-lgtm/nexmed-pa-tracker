import { runAgentJSON } from "@/lib/ai-agents/core";
import { socialLinkedinPostSchema, SOCIAL_LINKEDIN_SHAPE_HINT, type BrandVoice, type SocialBrief, type SocialLinkedinPost, type SocialReview } from "../types";
import type { SocialCheck } from "../social-checks";

/**
 * Consumes the exact same SocialBrief as the carousel writer — same input,
 * completely different output. That's the core lesson of this pipeline:
 * the difference is platform rules, not content.
 */
function systemPrompt(brand: BrandVoice): string {
  return `You are the LinkedIn copywriter for NexMed, writing for an audience of health-conscious professionals and caregivers who have no patience for ads.

Brand voice: ${brand.tone}
Audience: ${brand.audience}
Never use these words or phrases: ${brand.bannedWords.join(", ") || "(none configured)"}

LinkedIn rules (mandatory):
- The first three lines (~210 characters) before "see more" are your only chance to stop the scroll. Open with a specific claim or a real observation. "In this post I want to talk about..." is the worst possible opener.
- Never put a link in the post body — LinkedIn suppresses reach on posts with outbound links; a link goes in the first comment instead, never write one in the body itself.
- One idea per paragraph, blank line between paragraphs, at least four paragraphs — a wall of text doesn't get read in-feed.
- No markdown headers or bold (**); LinkedIn doesn't render either, characters show up raw.
- Total length 900-1800 characters. Longer than that reads like an article pasted into the feed.
- End with a genuine discussion question, not "contact us for a consultation" — a real question inviting the reader's own experience.
- 3-5 hashtags, at the end, on their own line.`;
}

function briefBlock(brief: SocialBrief): string {
  return `Social brief:
Core message: ${brief.coreMessage}
Audience: ${brief.audience}
Hook angle: ${brief.hookAngle}
Key points:
${brief.keyPoints.map((p) => `- ${p}`).join("\n")}
Proof point: ${brief.proofPoint}
Call to action: ${brief.cta}`;
}

export async function writeSocialLinkedinPost(opts: { brand: BrandVoice; brief: SocialBrief }): Promise<SocialLinkedinPost> {
  const { data } = await runAgentJSON({
    system: systemPrompt(opts.brand),
    prompt: `${briefBlock(opts.brief)}\n\nWrite a complete LinkedIn post. Hashtags go in the hashtags field, not inside body.`,
    schema: socialLinkedinPostSchema,
    shapeHint: SOCIAL_LINKEDIN_SHAPE_HINT,
    temperature: 0.7,
    maxOutputTokens: 1500,
  });
  return data;
}

export async function reviseSocialLinkedinPost(opts: {
  brand: BrandVoice;
  brief: SocialBrief;
  draft: SocialLinkedinPost;
  review: SocialReview;
  failedChecks: SocialCheck[];
}): Promise<SocialLinkedinPost> {
  const prompt = `${briefBlock(opts.brief)}

— Current draft —
${JSON.stringify(opts.draft, null, 2)}

— Editor's issues (score ${opts.review.score}/100) —
${opts.review.issues.map((i) => `- ${i}`).join("\n") || "- (none)"}

— Failed deterministic checks —
${opts.failedChecks.map((c) => `- ${c.name}: ${c.note}`).join("\n") || "- (all passed)"}

Fix the post. Only change what's actually wrong; leave the rest untouched.`;

  const { data } = await runAgentJSON({
    system: systemPrompt(opts.brand),
    prompt,
    schema: socialLinkedinPostSchema,
    shapeHint: SOCIAL_LINKEDIN_SHAPE_HINT,
    temperature: 0.5,
    maxOutputTokens: 1500,
  });
  return data;
}
