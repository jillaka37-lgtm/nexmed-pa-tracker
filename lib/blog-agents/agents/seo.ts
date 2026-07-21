import { runAgentJSON } from "@/lib/ai-agents/core";
import { lessonsBlockFor } from "../lessons";
import { seoOutputSchema, SEO_SHAPE_HINT, type Brief, type SeoOutput } from "../types";
import { runSeoChecks, type SeoCheck } from "../seo-checks";

export type SeoResult = { seo: SeoOutput; checks: SeoCheck[] };

const META_CHECK_NAMES = ["meta title length", "meta description length", "clean slug"];

/**
 * Two halves: an LLM half (writing the actual metadata copy) and a
 * deterministic half (seo-checks.ts). If the deterministic checks that
 * concern the metadata itself fail, we go back to the model once with the
 * specific failures — checks about the article's own text (H1 count, word
 * count) are the writer's responsibility, not something re-prompting the
 * SEO agent can fix.
 */
export async function generateSeoMeta(opts: { brief: Brief; contentMd: string; existingSlugs: string[] }): Promise<SeoResult> {
  const lessons = await lessonsBlockFor("seo");
  const system = `You write SEO metadata for the NexMed blog — metadata that's natural for search engines and appealing to readers, not keyword-stuffed.${lessons}`;

  const basePrompt = `Final article:
${opts.contentMd}

Primary keyword: ${opts.brief.primaryKeyword}
Secondary keywords: ${opts.brief.secondaryKeywords.join(", ")}

These slugs are already taken (don't repeat): ${opts.existingSlugs.join(", ") || "—"}

Build complete SEO metadata for this article:
- slug: short English kebab-case translation of the title.
- metaTitle: should include the primary keyword; can differ from the article title.
- faq: questions the article genuinely answers (for Google FAQ structured data).`;

  let seo = (await runAgentJSON({ system, prompt: basePrompt, schema: seoOutputSchema, shapeHint: SEO_SHAPE_HINT, temperature: 0.4, maxOutputTokens: 1200 })).data;
  let checks = runSeoChecks({ contentMd: opts.contentMd, metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, primaryKeyword: opts.brief.primaryKeyword, slug: seo.slug });

  const metaFailures = checks.filter((c) => !c.pass && META_CHECK_NAMES.includes(c.name));
  if (metaFailures.length > 0) {
    seo = (
      await runAgentJSON({
        system,
        prompt: `${basePrompt}\n\nYour previous output failed these deterministic checks:\n${metaFailures.map((f) => `- ${f.name}: ${f.note}`).join("\n")}\n\nFix the metadata so every check passes.`,
        schema: seoOutputSchema,
        shapeHint: SEO_SHAPE_HINT,
        temperature: 0.4,
        maxOutputTokens: 1200,
      })
    ).data;
    checks = runSeoChecks({ contentMd: opts.contentMd, metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, primaryKeyword: opts.brief.primaryKeyword, slug: seo.slug });
  }

  // Final uniqueness guarantee in code — don't trust the model's promise.
  if (opts.existingSlugs.includes(seo.slug)) {
    seo = { ...seo, slug: `${seo.slug}-${Math.random().toString(36).slice(2, 6)}` };
  }

  return { seo, checks };
}
