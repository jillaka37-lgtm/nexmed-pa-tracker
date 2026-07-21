/**
 * Allowed call-to-action list for reels — a business rule, not part of the
 * writer's craft, kept in its own file so a content manager can add/remove
 * one without touching the prompt. NexMed doesn't sell a course, so there's
 * no "enroll in our course" entry — giving the model a CTA for a product
 * that doesn't exist forces it to invent a fictional offering, the most
 * believable kind of hallucination.
 */
export type ReelsCta = {
  id: string;
  title: string;
  when: string;
  example: string;
  requiresLeadMagnet?: boolean;
};

export const REELS_CTAS: ReelsCta[] = [
  {
    id: "consultation",
    title: "Book a consultation",
    when: "The content is about a health/medication question that really needs a one-on-one conversation to resolve.",
    example: "If you want to go over this for your own situation, message us to set up a consultation.",
  },
  {
    id: "follow",
    title: "Follow",
    when: "The content is timely/seasonal, or the viewer is new and you want to keep them around.",
    example: "If tips like this are useful, follow us for more.",
  },
  {
    id: "save",
    title: "Save this",
    when: "Practical, step-by-step, or reference content the viewer will want to come back to.",
    example: "Save this so it's handy next time you need it.",
  },
  {
    id: "share",
    title: "Send or tag someone",
    when: "The content is clearly useful to a specific person the viewer knows.",
    example: "If you know someone dealing with this, send them this video.",
  },
  {
    id: "lead-magnet",
    title: "Comment a keyword for a free resource",
    when: "A free resource exists (checklist, guide) that matches this video's topic.",
    example: 'Comment "[word]" and we\'ll send you [resource].',
    requiresLeadMagnet: true,
  },
  {
    id: "try-it",
    title: "Try it and comment the result",
    when: "The content is a practical tip or technique the viewer can try right away.",
    example: "Try this today and let us know how it goes in the comments.",
  },
  {
    id: "discuss",
    title: "Share an opinion or suggest the next topic",
    when: "The content is a bit of a debate, or you want to start a comment discussion.",
    example: "What's your take? Comment and tell us what topic to cover next.",
  },
  {
    id: "bio-link",
    title: "Link in bio",
    when: "The content points to a page, article, or outside resource.",
    example: "It's linked in our bio — check it out from there.",
  },
];

/** Available CTAs for this run — the lead-magnet one drops out with no
 * free resource configured. */
export function availableCtas(hasLeadMagnet: boolean): ReelsCta[] {
  return REELS_CTAS.filter((c) => !c.requiresLeadMagnet || hasLeadMagnet);
}

/** Rendered list for injection into the writer's prompt. */
export function ctaListBlock(hasLeadMagnet: boolean): string {
  return availableCtas(hasLeadMagnet)
    .map((c, i) => `${i + 1}. ${c.title} (id: ${c.id})\n   when: ${c.when}\n   example: "${c.example}"`)
    .join("\n");
}
