/**
 * Deterministic SEO checks — no LLM. Anything exact and computable (meta
 * length, H1 count, keyword presence in the intro) is cheaper and 100%
 * reliable as plain code. Keep the model for judgment calls; measure
 * mechanical rules with code.
 */
export type SeoCheck = { name: string; pass: boolean; note: string };

export function runSeoChecks(input: {
  contentMd: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  slug: string;
}): SeoCheck[] {
  const { contentMd, metaTitle, metaDescription, primaryKeyword, slug } = input;
  const checks: SeoCheck[] = [];

  const h1Count = (contentMd.match(/^# /gm) ?? []).length;
  checks.push({
    name: "single H1",
    pass: h1Count === 1,
    note: h1Count === 1 ? "article has exactly one H1" : `H1 count: ${h1Count} (should be 1)`,
  });

  const h2Count = (contentMd.match(/^## /gm) ?? []).length;
  checks.push({ name: "heading structure", pass: h2Count >= 3, note: `${h2Count} H2 headings (min 3)` });

  const body = contentMd.replace(/^# .*$/m, "").trim();
  const kwEarly = body.slice(0, 300).toLowerCase().includes(primaryKeyword.toLowerCase());
  checks.push({
    name: "keyword in intro",
    pass: kwEarly,
    note: kwEarly ? "primary keyword appears early" : `"${primaryKeyword}" not found in the first 300 characters`,
  });

  checks.push({
    name: "meta title length",
    pass: metaTitle.length >= 30 && metaTitle.length <= 65,
    note: `${metaTitle.length} characters (target 30-65)`,
  });

  checks.push({
    name: "meta description length",
    pass: metaDescription.length >= 70 && metaDescription.length <= 160,
    note: `${metaDescription.length} characters (target 70-160)`,
  });

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
  checks.push({ name: "clean slug", pass: slugOk, note: slugOk ? slug : `invalid slug: ${slug}` });

  const wordCount = contentMd.split(/\s+/).length;
  checks.push({ name: "article length", pass: wordCount >= 400, note: `~${wordCount} words (min 400)` });

  return checks;
}
