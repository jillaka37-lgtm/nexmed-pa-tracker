import { runAgentJSON } from "@/lib/ai-agents/core";
import { instagramCarouselSchema, CAROUSEL_SHAPE_HINT, type BrandVoice, type InstagramCarousel, type SocialBrief, type SocialReview } from "../types";
import type { SocialCheck } from "../social-checks";

/**
 * Structured output, not free text — unlike the blog writer, each slide is
 * rendered individually in a 1:1 frame later, so the shape must be
 * guaranteed, not a string we'd have to parse back apart.
 */
function systemPrompt(brand: BrandVoice): string {
  return `You are the Instagram copywriter for NexMed. You write educational carousels that make a busy person stop scrolling.

Brand voice: ${brand.tone}
Audience: ${brand.audience}
Never use these words or phrases: ${brand.bannedWords.join(", ") || "(none configured)"}

Instagram rules (mandatory):
- The caption's first sentence is the hook and must be under 125 characters — Instagram truncates around there with "... more". It must stand alone and create curiosity, and end with a period or question mark. Don't open with a greeting, the brand name, or "In this post...".
- 5-8 slides: slide 1 = hook (visual take on the idea, not a literal copy of the caption). Middle slides = exactly one idea each. Last slide = call to action.
- Slide heading must be readable at thumbnail size: short, no subordinate clause. Text max two short sentences.
- Never put a link in the caption — Instagram doesn't make caption links clickable; write "link in bio" instead.
- 8-15 hashtags, each starting with # and no spaces, no duplicates. No spammy hashtags (#follow, #like, #followback).
- Sparse, purposeful emoji. The brand voice doesn't allow hyped, ad-like tone.`;
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

export async function writeCarousel(opts: { brand: BrandVoice; brief: SocialBrief }): Promise<InstagramCarousel> {
  const { data } = await runAgentJSON({
    system: systemPrompt(opts.brand),
    prompt: `${briefBlock(opts.brief)}\n\nWrite a complete Instagram carousel.`,
    schema: instagramCarouselSchema,
    shapeHint: CAROUSEL_SHAPE_HINT,
    temperature: 0.8,
    maxOutputTokens: 1500,
  });
  return data;
}

/** Revises based on the editor's issues AND any failed deterministic
 * checks — the full previous draft is given so the model fixes rather than
 * rewrites from scratch, keeping the parts that already worked. */
export async function reviseCarousel(opts: {
  brand: BrandVoice;
  brief: SocialBrief;
  draft: InstagramCarousel;
  review: SocialReview;
  failedChecks: SocialCheck[];
}): Promise<InstagramCarousel> {
  const prompt = `${briefBlock(opts.brief)}

— Current draft —
${JSON.stringify(opts.draft, null, 2)}

— Editor's issues (score ${opts.review.score}/100) —
${opts.review.issues.map((i) => `- ${i}`).join("\n") || "- (none)"}

— Failed deterministic checks —
${opts.failedChecks.map((c) => `- ${c.name}: ${c.note}`).join("\n") || "- (all passed)"}

Fix the carousel. Only change what's actually wrong; leave the rest untouched.`;

  const { data } = await runAgentJSON({
    system: systemPrompt(opts.brand),
    prompt,
    schema: instagramCarouselSchema,
    shapeHint: CAROUSEL_SHAPE_HINT,
    temperature: 0.6,
    maxOutputTokens: 1500,
  });
  return data;
}
