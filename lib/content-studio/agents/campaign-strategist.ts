import { runAgentJSON } from "@/lib/ai-agents/core";
import { campaignNarrativeSchema, CAMPAIGN_NARRATIVE_SHAPE_HINT, type BrandVoice, type CampaignNarrative } from "../types";

/**
 * From a theme, builds the "mother narrative": the central idea, the
 * tension, NexMed's answer, and a distinct angle for each channel.
 *
 * Why this layer is necessary: without it, running four pipelines off one
 * shared "topic" produces four unrelated pieces with a shared label. A
 * campaign means one message, repeated in different clothes across
 * channels — someone who sees all four should feel like one voice is
 * talking to them, not four.
 */
export async function buildCampaignNarrative(opts: {
  brand: BrandVoice;
  theme: string;
  existingTitles: string[];
}): Promise<CampaignNarrative> {
  const system = `You are the campaign strategist for NexMed. From a theme, you build a mother narrative that later gets repeated across the blog, Instagram, LinkedIn, and reels in different clothes.

Brand voice: ${opts.brand.tone}
Audience: ${opts.brand.audience}

Rules:
- One idea, not several. bigIdea must be specific enough to state in one sentence, and big enough that four different pieces of content can come from it. If you can't say it in one sentence, it's not sharp enough yet.
- tension must be a real contradiction in the reader's situation, not a generic "problem." Good example: "the more medications someone is on, the harder it becomes to actually take them correctly." Bad example: "medication management is hard."
- Each channel's angle must be genuinely DIFFERENT, not a summary of the same thing:
  · blog = depth and framework; where someone searching for an answer finds it.
  · instagram = a fast, visual cut; something that stops the scroll.
  · linkedin = an observation and experience; something that starts a professional conversation.
  · reels = one SPEAKABLE idea in under a minute; not a list, not a framework — an idea carried by voice.
  If these four angles come out similar, the campaign has failed — rethink it.
- Never invent a number, percentage, or statistic in any field. This is the most important rule: these angles go directly to copywriters, who will treat anything in their input as real. Writing "a company with 10% sales growth that lost 2% margin" means fabricating a case study that gets published under NexMed's name. State the relationship instead of a number: "sales go up but margin doesn't follow."`;

  const existing = opts.existingTitles.length
    ? `\n\nExisting content (don't repeat this theme):\n${opts.existingTitles.slice(0, 20).map((t) => `- ${t}`).join("\n")}`
    : "";

  const prompt = `Campaign theme: "${opts.theme}"${existing}\n\nBuild this campaign's mother narrative.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: campaignNarrativeSchema,
    shapeHint: CAMPAIGN_NARRATIVE_SHAPE_HINT,
    temperature: 0.6,
    maxOutputTokens: 1200,
  });
  return data;
}
