import { createAdminClient } from "@/lib/supabase/admin";
import type { DraftIntake, DraftOutput } from "./schema";

export type PriorAuthDraft = DraftIntake &
  DraftOutput & {
    id: string;
    status: "draft" | "reviewed" | "submitted";
    createdAt: string;
  };

export async function saveDraft(
  intake: DraftIntake,
  output: DraftOutput,
  createdBy: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prior_auth_drafts")
    .insert({
      case_id: intake.caseId,
      insurer: intake.insurer,
      medication: intake.medication,
      diagnosis: intake.diagnosis,
      prior_treatments: intake.priorTreatments,
      notes: intake.notes ?? null,
      letter_body: output.letterBody,
      medical_necessity_summary: output.medicalNecessitySummary,
      prior_treatment_summary: output.priorTreatmentSummary.join("\n"),
      missing_info_warnings: output.missingInfoWarnings,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save draft: ${error?.message}`);
  }
  return data.id;
}

export async function getDraft(id: string): Promise<PriorAuthDraft | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prior_auth_drafts")
    .select(
      "id, case_id, insurer, medication, diagnosis, prior_treatments, notes, letter_body, medical_necessity_summary, prior_treatment_summary, missing_info_warnings, status, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    caseId: data.case_id,
    insurer: data.insurer,
    medication: data.medication,
    diagnosis: data.diagnosis,
    priorTreatments: data.prior_treatments,
    notes: data.notes ?? undefined,
    letterBody: data.letter_body,
    medicalNecessitySummary: data.medical_necessity_summary,
    priorTreatmentSummary: data.prior_treatment_summary.split("\n").filter(Boolean),
    missingInfoWarnings: (data.missing_info_warnings as string[]) ?? [],
    status: data.status,
    createdAt: data.created_at,
  };
}
