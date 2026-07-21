import { z } from "zod";

export type BrandVoice = {
  id: string;
  tone: string;
  bannedWords: string[];
  audience: string;
  updatedAt: string;
};

export function brandVoiceFromRow(row: {
  id: string;
  tone: string;
  banned_words: string[];
  audience: string;
  updated_at: string;
}): BrandVoice {
  return {
    id: row.id,
    tone: row.tone,
    bannedWords: row.banned_words,
    audience: row.audience,
    updatedAt: row.updated_at,
  };
}

export type ContentBrief = {
  id: string;
  topics: string[];
  campaign: string | null;
  notes: string | null;
  createdAt: string;
};

export type ContentPlatform = "linkedin" | "reels" | "carousel";
export type ContentStatus = "draft" | "approved" | "rejected";

export type ContentPiece = {
  id: string;
  briefId: string;
  platform: ContentPlatform;
  hook: string | null;
  body: string;
  status: ContentStatus;
  rejectReason: string | null;
  score: number | null;
  createdAt: string;
};

export function contentPieceFromRow(row: {
  id: string;
  brief_id: string;
  platform: ContentPlatform;
  hook: string | null;
  body: string;
  status: ContentStatus;
  reject_reason: string | null;
  score: number | null;
  created_at: string;
}): ContentPiece {
  return {
    id: row.id,
    briefId: row.brief_id,
    platform: row.platform,
    hook: row.hook,
    body: row.body,
    status: row.status,
    rejectReason: row.reject_reason,
    score: row.score,
    createdAt: row.created_at,
  };
}

/** LinkedIn writer agent's structured output. */
export const linkedinDraftSchema = z.object({
  hook: z.string().describe("First line, must stop the scroll, under 210 characters"),
  body: z.string().describe("Full post body, 900-1800 characters, short paragraphs, no markdown"),
  hashtags: z.array(z.string()).min(3).max(5),
});
export type LinkedinDraft = z.infer<typeof linkedinDraftSchema>;

export const LINKEDIN_SHAPE_HINT = `{"hook": "...", "body": "...", "hashtags": ["...", "..."]}`;

/* ── Carousel pipeline (ported from arkan-content-studio) ─────────────── */

/** Hard character caps enforced in code, not left to the model to
 * self-police — LLMs can't reliably count characters, so a zod `.max()`
 * that rejects a too-long output would kill the whole run over a few
 * stray characters. Trims to the nearest word boundary instead. */
export function clampText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return base.trimEnd() + "…";
}

/** A social idea is scored on "does it stop the scroll", not search intent
 * — a good SEO idea and a good feed idea are different things; nobody is
 * searching for a carousel topic. */
export const socialIdeaSchema = z.object({
  title: z.string().min(4),
  hook: z.string().min(10),
  painPoint: z.string(),
  score: z.number().min(0).max(10),
  reason: z.string(),
});
export type SocialIdea = z.infer<typeof socialIdeaSchema>;
export const socialIdeaScoutOutputSchema = z.object({ ideas: z.array(socialIdeaSchema).min(3) });
export const SOCIAL_IDEA_SHAPE_HINT = `{"ideas":[{"title":"...","hook":"...","painPoint":"...","score":0,"reason":"..."}]}`;

/** Shared brief contract every social channel writer consumes — this is
 * the single most important architecture decision in this pipeline: it's
 * why adding a second channel later reuses ~60% of this code untouched. */
export const socialBriefSchema = z.object({
  coreMessage: z.string().min(20),
  audience: z.string(),
  keyPoints: z.array(z.string()).min(3).max(6),
  hookAngle: z.string().min(10),
  proofPoint: z.string(),
  cta: z.string(),
});
export type SocialBrief = z.infer<typeof socialBriefSchema>;
export const SOCIAL_BRIEF_SHAPE_HINT = `{"coreMessage":"...","audience":"...","keyPoints":["...","...","..."],"hookAngle":"...","proofPoint":"...","cta":"..."}`;

export const slideSchema = z.object({
  kicker: z.string().transform((s) => clampText(s, 24)),
  heading: z.string().min(3).transform((s) => clampText(s, 40)),
  text: z.string().transform((s) => clampText(s, 140)),
});
export type Slide = z.infer<typeof slideSchema>;

export const instagramCarouselSchema = z.object({
  title: z.string().min(4),
  caption: z.string().min(80).transform((s) => clampText(s, 2200)),
  // Range matches the content_pieces_slides_shape DB check constraint — if
  // you change one, change the other.
  slides: z.array(slideSchema).min(5).max(8),
  hashtags: z.array(z.string()).min(8).max(15),
  cta: z.string().min(5),
});
export type InstagramCarousel = z.infer<typeof instagramCarouselSchema>;
export const CAROUSEL_SHAPE_HINT = `{"title":"...","caption":"first ~125 chars is the hook","slides":[{"kicker":"...","heading":"...","text":"..."}],"hashtags":["#...","#..."],"cta":"..."}`;

export const socialReviewSchema = z.object({
  score: z.number().min(0).max(100),
  rubric: z.object({
    hook: z.number().min(0).max(10),
    platformFit: z.number().min(0).max(10),
    brandVoice: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
  }),
  issues: z.array(z.string()),
  verdict: z.enum(["approve", "revise"]),
});
export type SocialReview = z.infer<typeof socialReviewSchema>;
export const SOCIAL_REVIEW_SHAPE_HINT = `{"score":78,"rubric":{"hook":8,"platformFit":8,"brandVoice":8,"clarity":7},"issues":["..."],"verdict":"approve"}`;

/* ── Standalone LinkedIn (observation-based) ──────────────────────────── */

export const socialLinkedinPostSchema = z.object({
  title: z.string().min(4),
  body: z.string().min(400).transform((s) => clampText(s, 2800)),
  hashtags: z.array(z.string()).min(3).max(5),
  cta: z.string().min(5),
});
export type SocialLinkedinPost = z.infer<typeof socialLinkedinPostSchema>;
export const SOCIAL_LINKEDIN_SHAPE_HINT = `{"title":"...","body":"full post, blank line between paragraphs","hashtags":["#...","#...","#..."],"cta":"closing discussion question"}`;

/* ── Reels ─────────────────────────────────────────────────────────── */

export const reelsScriptSchema = z.object({
  title: z.string().min(4),
  hook: z.string().min(10).transform((s) => clampText(s, 220)),
  body: z.string().min(150),
  cta: z.string().min(10),
  ctaId: z.string().min(2),
  ctaReason: z.string().min(10),
  onScreenText: z.string().min(3).transform((s) => clampText(s, 45)),
  caption: z.string().min(40).transform((s) => clampText(s, 2200)),
  hashtags: z.array(z.string()).min(3).max(5),
});
export type ReelsScript = z.infer<typeof reelsScriptSchema>;
export const REELS_SHAPE_HINT = `{"title":"...","hook":"first 3-5 seconds, said aloud","body":"speakable body","cta":"spoken CTA","ctaId":"consultation","ctaReason":"...","onScreenText":"short hook-frame text","caption":"...","hashtags":["#...","#...","#..."]}`;

/* ── Campaign (multi-channel) ─────────────────────────────────────────── */

/**
 * The "mother narrative" every channel derives from. Without this layer,
 * running four pipelines off one shared "topic" produces four unrelated
 * pieces with a shared label — a campaign means one message repeated in
 * different clothes across channels, not four separate productions.
 */
export const campaignNarrativeSchema = z.object({
  bigIdea: z.string().min(20),
  audience: z.string(),
  tension: z.string().min(10),
  resolution: z.string().min(10),
  pillars: z.array(z.string()).min(3).max(5),
  blogAngle: z.string().min(10),
  instagramAngle: z.string().min(10),
  linkedinAngle: z.string().min(10),
  reelsAngle: z.string().min(10),
});
export type CampaignNarrative = z.infer<typeof campaignNarrativeSchema>;
export const CAMPAIGN_NARRATIVE_SHAPE_HINT = `{"bigIdea":"...","audience":"...","tension":"...","resolution":"...","pillars":["...","...","..."],"blogAngle":"...","instagramAngle":"...","linkedinAngle":"...","reelsAngle":"..."}`;
