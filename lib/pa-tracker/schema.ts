import { z } from "zod";

export const PA_STATUSES = ["new", "sent", "waiting", "approved", "denied"] as const;
export type PaStatus = (typeof PA_STATUSES)[number];

export const caseCreateSchema = z.object({
  caseId: z.string().trim().min(1).max(80),
  insurer: z.string().trim().min(1).max(200),
  medication: z.string().trim().min(1).max(300),
  diagnosis: z.string().trim().max(300).optional(),
  dueAt: z.string().datetime().optional(),
  assignedTo: z.string().uuid().optional(),
});
export type CaseCreateInput = z.infer<typeof caseCreateSchema>;

export const caseUpdateSchema = z.object({
  status: z.enum(PA_STATUSES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
