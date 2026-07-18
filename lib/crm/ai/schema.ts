import { z } from "zod";

export const leadScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  rationale: z.string(),
});
export type LeadScore = z.infer<typeof leadScoreSchema>;
