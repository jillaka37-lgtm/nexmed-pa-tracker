import { z } from "zod";

/** Every agent id must be registered here — the orchestrator, the critic's
 * lesson targeting, and the studio timeline icons all key off this list.
 * Missing an id here is a silent failure mode: zod rejects the critic's
 * output for an unknown agent, the retry burns a call, and the step's
 * try/catch swallows it — no error surfaces, the lesson is just never
 * written. Matches the real arkan-blog-agents AGENT_IDS — critic/publisher
 * deliberately excluded, since lessons only ever target an upstream agent. */
export const AGENT_IDS = ["idea-scout", "strategist", "researcher", "writer", "editor", "seo"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const ALL_STEP_IDS = [...AGENT_IDS, "publisher", "critic"] as const;
export type StepId = (typeof ALL_STEP_IDS)[number];

export const AGENT_LABELS: Record<StepId, string> = {
  "idea-scout": "Idea Scout",
  strategist: "Content Strategist",
  researcher: "Researcher",
  writer: "Writer",
  editor: "Editor",
  seo: "SEO",
  publisher: "Publisher",
  critic: "Critic",
};

/* ── 1. Idea Scout ─────────────────────────────────────────── */

export const ideaSchema = z.object({
  title: z.string().min(4),
  angle: z.string(),
  searchIntent: z.string(),
  score: z.number().min(0).max(10),
  reason: z.string(),
});
export type Idea = z.infer<typeof ideaSchema>;

export const ideaScoutOutputSchema = z.object({ ideas: z.array(ideaSchema).min(3) });
export const IDEA_SHAPE_HINT = `{"ideas":[{"title":"...","angle":"...","searchIntent":"...","score":0,"reason":"..."}]}`;

/* ── 2. Strategist ─────────────────────────────────────────── */

export const briefSchema = z.object({
  title: z.string(),
  audience: z.string(),
  searchIntent: z.string(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).min(2).max(8),
  outline: z.array(z.object({ heading: z.string(), points: z.array(z.string()) })).min(3),
  targetWordCount: z.number().min(600).max(3000),
  cta: z.string(),
});
export type Brief = z.infer<typeof briefSchema>;
export const BRIEF_SHAPE_HINT = `{"title":"...","audience":"...","searchIntent":"...","primaryKeyword":"...","secondaryKeywords":["...","..."],"outline":[{"heading":"...","points":["..."]}],"targetWordCount":1200,"cta":"..."}`;

/* ── 3. Researcher ─────────────────────────────────────────── */

export const researchSchema = z.object({
  keyFacts: z.array(z.string()).min(3),
  examples: z.array(z.string()),
  commonQuestions: z.array(z.string()).min(2),
  angleNotes: z.string(),
});
export type Research = z.infer<typeof researchSchema>;
export const RESEARCH_SHAPE_HINT = `{"keyFacts":["..."],"examples":["..."],"commonQuestions":["..."],"angleNotes":"..."}`;

/* ── 5. Editor ─────────────────────────────────────────────── */

export const reviewSchema = z.object({
  score: z.number().min(0).max(100),
  rubric: z.object({
    clarity: z.number().min(0).max(10),
    brandVoice: z.number().min(0).max(10),
    usefulness: z.number().min(0).max(10),
    structure: z.number().min(0).max(10),
  }),
  issues: z.array(z.string()),
  verdict: z.enum(["approve", "revise"]),
});
export type Review = z.infer<typeof reviewSchema>;
export const REVIEW_SHAPE_HINT = `{"score":82,"rubric":{"clarity":8,"brandVoice":9,"usefulness":8,"structure":8},"issues":["..."],"verdict":"approve"}`;

/* ── 6. SEO ────────────────────────────────────────────────── */

/**
 * Clamps text to a hard character cap, preferring a word boundary — LLMs
 * (especially outside English) can't reliably count characters, so a zod
 * `.max()` that rejects a too-long output would kill the whole run over a
 * few stray characters. Same fix already used for reels/carousel-style
 * length limits: enforce deterministically in code, don't ask the model to
 * self-police an exact count.
 */
export function clampText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return base.trimEnd() + "…";
}

export const seoOutputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  metaTitle: z.string().min(10).transform((s) => clampText(s, 65)),
  metaDescription: z.string().min(50).transform((s) => clampText(s, 160)),
  excerpt: z.string().min(30),
  keywords: z.array(z.string()).min(3).max(10),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(2).max(6),
});
export type SeoOutput = z.infer<typeof seoOutputSchema>;
export const SEO_SHAPE_HINT = `{"slug":"english-slug-with-dashes","metaTitle":"30-65 chars","metaDescription":"70-160 chars","excerpt":"2-3 sentence summary","keywords":["...","...","..."],"faq":[{"question":"...","answer":"..."}]}`;

/* ── 8. Critic (self-improvement) ─────────────────────────── */

export const criticOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  lessons: z.array(z.object({ agent: z.enum(AGENT_IDS), lesson: z.string().min(10) })).max(3),
});
export type CriticOutput = z.infer<typeof criticOutputSchema>;
export const CRITIC_SHAPE_HINT = `{"overallScore":80,"strengths":["..."],"weaknesses":["..."],"lessons":[{"agent":"writer","lesson":"..."}]}`;

export const feedbackLessonsSchema = z.object({
  lessons: z.array(z.object({ agent: z.enum(AGENT_IDS), lesson: z.string().min(10) })).max(2),
});
export const FEEDBACK_SHAPE_HINT = `{"lessons":[{"agent":"writer","lesson":"..."}]}`;

/* ── Pipeline run / post ───────────────────────────────────── */

export type PipelineStep = {
  agent: StepId;
  label: string;
  status: "running" | "done" | "error";
  summary?: string;
  startedAt: string;
  finishedAt?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentMd: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  faq: { question: string; answer: string }[];
  score: number | null;
  status: "draft" | "published";
  createdAt: string;
  publishedAt: string | null;
};

export function blogPostFromRow(row: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: unknown;
  faq: unknown;
  score: number | null;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
}): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    contentMd: row.content_md,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as { question: string; answer: string }[]) : [],
    score: row.score,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}
