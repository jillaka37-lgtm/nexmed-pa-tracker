import { runAgentJSON, dataBlock } from "@/lib/ai-agents/core";
import { linkedinDraftSchema, LINKEDIN_SHAPE_HINT, type BrandVoice, type LinkedinDraft } from "../types";

function systemPrompt(brand: BrandVoice): string {
  return `You are the LinkedIn copywriter for NexMed, a pharmacy/health brand.

Brand voice: ${brand.tone}
Audience: ${brand.audience}
Never use these words or phrases: ${brand.bannedWords.join(", ") || "(none configured)"}

Write one LinkedIn post per request. Rules:
- Hook (first line) must earn a click without being clickbait — no emojis in the hook.
- Short paragraphs (2-3 sentences), no markdown formatting (LinkedIn does not render it).
- End with a light question or clear call to action.
- 3-5 relevant hashtags, no links inside the body.
- Never invent medical claims, prices, or services not present in the brief.`;
}

export async function writeLinkedinPost(opts: {
  brand: BrandVoice;
  briefText: string;
}): Promise<{ draft: LinkedinDraft; usage: { inputTokens: number; outputTokens: number } }> {
  const prompt = `${dataBlock("brief", opts.briefText)}

Write a LinkedIn post based on the brief above.`;

  const { data, usage } = await runAgentJSON({
    system: systemPrompt(opts.brand),
    prompt,
    schema: linkedinDraftSchema,
    shapeHint: LINKEDIN_SHAPE_HINT,
    temperature: 0.7,
    maxOutputTokens: 2000,
  });

  return { draft: data, usage };
}
