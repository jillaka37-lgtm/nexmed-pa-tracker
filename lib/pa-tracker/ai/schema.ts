import { z } from "zod";

export const rejectionExplainSchema = z.object({
  code: z.string().describe("The rejection code as given, or 'unspecified' if none was provided."),
  meaning: z.string().describe("Plain-English explanation of what this rejection means."),
  whatToDoNext: z.string().describe("The concrete next step staff should take to resolve it."),
});
export type RejectionExplain = z.infer<typeof rejectionExplainSchema>;

export const nextActionSchema = z.object({
  suggestedAction: z.string().describe("A single concrete next action for staff to take on this case."),
  reasoning: z.string().describe("Why this is the right next step given the case's current status and history."),
});
export type NextAction = z.infer<typeof nextActionSchema>;

export const prescriberDraftSchema = z.object({
  subject: z.string().describe("A short subject line for a fax or message to the prescriber."),
  body: z.string().describe("The full fax/message body, formal and specific to this case."),
});
export type PrescriberDraft = z.infer<typeof prescriberDraftSchema>;

export const patientUpdateSchema = z.object({
  smsBody: z.string().max(320).describe("A short SMS-length update for the patient (plain, reassuring, no jargon)."),
  emailBody: z.string().describe("A longer, friendlier email update for the patient with a bit more detail."),
});
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;
