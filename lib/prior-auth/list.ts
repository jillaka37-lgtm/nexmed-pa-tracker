import { createAdminClient } from "@/lib/supabase/admin";

export type DraftListItem = {
  id: string;
  caseId: string;
  insurer: string;
  medication: string;
  status: "draft" | "reviewed" | "submitted";
  createdAt: string;
};

export async function listDrafts(): Promise<DraftListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prior_auth_drafts")
    .select("id, case_id, insurer, medication, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    insurer: row.insurer,
    medication: row.medication,
    status: row.status,
    createdAt: row.created_at,
  }));
}
