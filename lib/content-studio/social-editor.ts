import { runAgentJSON } from "@/lib/ai-agents/core";
import { socialReviewSchema, SOCIAL_REVIEW_SHAPE_HINT, type BrandVoice, type SocialBrief, type SocialReview } from "./types";
import type { SocialCheck } from "./social-checks";

/** Below blog's 75 — short-form content has less surface area to score and
 * only gets one revision round. */
export const SOCIAL_APPROVE_THRESHOLD = 70;

export type SocialChannel = "carousel" | "linkedin" | "reels";

const CHANNEL_RUBRIC: Record<SocialChannel, string> = {
  carousel: `- hook: does the caption's first sentence actually stop the scroll on its own?
- platformFit: is this really an Instagram carousel? One idea per slide, slide 1 = hook, last slide = call to action, text short enough to read on the image.`,
  linkedin: `- hook: does the first three lines (before "see more") make a specific claim?
- platformFit: is this really a LinkedIn post? Short paragraphs, no markdown headers, ends with a question inviting discussion, professional not promotional tone.`,
  reels: `- hook: does the first line grab attention in 3-5 seconds, with no throat-clearing?
- platformFit: is this actually speakable? Read it aloud in your head — sentences should be short and breathable, no stiff written-register phrasing. The CTA should feel attached to the content, not bolted on.`,
};

const CHANNEL_LABEL: Record<SocialChannel, string> = {
  carousel: "Instagram carousel",
  linkedin: "LinkedIn post",
  reels: "Reels script",
};

/**
 * Generator/Critic pattern, same as the blog editor: a model reviewing its
 * own writing isn't a harsh critic. Separate editor with a numeric rubric
 * is the actual quality gate. Given the deterministic checks that already
 * failed, so it doesn't re-judge what code already measured — same split
 * as seo.ts / seo-checks.ts.
 */
export async function runSocialEditor(opts: {
  brand: BrandVoice;
  channel: SocialChannel;
  brief: SocialBrief;
  draft: unknown;
  failedChecks: SocialCheck[];
}): Promise<SocialReview> {
  const label = CHANNEL_LABEL[opts.channel];
  const system = `You are the social content editor for NexMed — strict but fair. Your job is judging quality, not rewriting. Issues you raise must be specific enough that the copywriter knows exactly what to change.

Brand voice: ${opts.brand.tone}`;

  const prompt = `Social brief:
Core message: ${opts.brief.coreMessage}
Audience: ${opts.brief.audience}
Hook angle: ${opts.brief.hookAngle}

— ${label} to review —
${JSON.stringify(opts.draft, null, 2)}

— Failed deterministic checks (already measured by code, don't re-judge these) —
${opts.failedChecks.map((c) => `- ${c.name}: ${c.note}`).join("\n") || "- (all passed)"}

Score this content on the rubric below (0-10 each):
${CHANNEL_RUBRIC[opts.channel]}
- brandVoice: matches the brand voice — no hype, no ad-like tone?
- clarity: is the core message clear, or lost in generality?

score = sum of the four criteria × 2.5 (0-100).
If score is below ${SOCIAL_APPROVE_THRESHOLD}, set verdict to "revise" and be specific in issues; otherwise "approve".`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: socialReviewSchema,
    shapeHint: SOCIAL_REVIEW_SHAPE_HINT,
    temperature: 0.3,
    maxOutputTokens: 800,
  });
  return data;
}
