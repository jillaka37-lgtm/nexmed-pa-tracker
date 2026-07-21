import { z } from "zod";

export const leadScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  rationale: z.string(),
});
export type LeadScore = z.infer<typeof leadScoreSchema>;

export const chatSummarySchema = z.object({
  needs: z.array(z.string()).describe("What the person is trying to accomplish"),
  concerns: z.array(z.string()).describe("Objections, hesitations, or worries they raised"),
  buyingSignals: z.array(z.string()).describe("Anything suggesting readiness to book/buy — empty array if none"),
  summary: z.string().describe("2-3 sentence prose summary for a staff member skimming the profile"),
});
export type ChatSummary = z.infer<typeof chatSummarySchema>;

export const nextActionSchema = z.object({
  action: z.string().describe("The single most useful next action, one sentence, imperative"),
  reasoning: z.string().describe("One sentence on why, referencing stage/time/recent activity"),
});
export type NextAction = z.infer<typeof nextActionSchema>;
