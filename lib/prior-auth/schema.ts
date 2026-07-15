import { z } from "zod";

export const draftIntakeSchema = z.object({
  caseId: z.string().trim().min(1).max(80),
  insurer: z.string().trim().min(1).max(200),
  medication: z.string().trim().min(1).max(300),
  diagnosis: z.string().trim().min(1).max(300),
  priorTreatments: z.string().trim().min(1).max(2000),
  notes: z.string().trim().max(2000).optional(),
});

export type DraftIntake = z.infer<typeof draftIntakeSchema>;

export const draftOutputSchema = z.object({
  letterBody: z
    .string()
    .describe("The full prior authorization letter, ready to review and submit — formal, addressed to the insurer's medical review team."),
  medicalNecessitySummary: z
    .string()
    .describe("A focused paragraph explaining why this medication is medically necessary given the diagnosis and treatment history."),
  priorTreatmentSummary: z
    .array(z.string())
    .describe("Prior treatments tried, one item per treatment, each stating the treatment, duration, and outcome/reason it was insufficient."),
  missingInfoWarnings: z
    .array(z.string())
    .describe("Anything the letter needed but the intake didn't provide (e.g. recent lab values, exact trial durations). Empty array if nothing is missing."),
});

export type DraftOutput = z.infer<typeof draftOutputSchema>;
