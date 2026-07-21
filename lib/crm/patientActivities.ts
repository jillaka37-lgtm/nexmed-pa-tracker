import { createAdminClient } from "@/lib/supabase/admin";
import type { PatientActivity, PatientActivityType } from "./types";

// Raw Supabase row shape is intentionally untyped here — the function's own
// return type is what actually enforces field types for every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToActivity(data: Record<string, any>): PatientActivity {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    title: data.title,
    body: data.body,
    dueAt: data.due_at,
    remindAt: data.remind_at,
    doneAt: data.done_at,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function listPatientActivitiesByType(
  type: PatientActivityType,
): Promise<(PatientActivity & { patientName: string | null })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patient_activities")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];

  // No direct FK between patient_activities and profiles (both reference
  // auth.users independently), so PostgREST can't embed the join — resolve
  // patient names with a second lookup, same pattern as admin/messages.
  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return data.map((row) => ({ ...rowToActivity(row), patientName: nameById.get(row.user_id) ?? null }));
}

export async function listPatientTimeline(userId: string): Promise<PatientActivity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patient_activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToActivity);
}

export async function createPatientActivity(
  input: {
    userId: string;
    type: PatientActivityType;
    title: string;
    body?: string;
    dueAt?: string;
    remindAt?: string;
  },
  actorId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("patient_activities").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title.trim(),
    body: input.body?.trim() || null,
    due_at: input.dueAt || null,
    remind_at: input.remindAt || null,
    created_by: actorId,
  });
  return !error;
}

export async function completePatientActivity(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("patient_activities").update({ done_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
