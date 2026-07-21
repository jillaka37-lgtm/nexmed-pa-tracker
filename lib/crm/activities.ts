import { createAdminClient } from "@/lib/supabase/admin";
import type { Activity, ActivityType } from "./types";

// Raw Supabase row shape is intentionally untyped here — the function's own
// return type is what actually enforces field types for every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToActivity(data: Record<string, any>): Activity {
  return {
    id: data.id,
    contactId: data.contact_id,
    dealId: data.deal_id,
    type: data.type,
    title: data.title,
    body: data.body,
    dueAt: data.due_at,
    doneAt: data.done_at,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function listContactTimeline(contactId: string): Promise<Activity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activities")
    .select("id, contact_id, deal_id, type, title, body, due_at, done_at, created_by, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToActivity);
}

export async function listRecentActivitiesForDeal(dealId: string, limit = 5): Promise<Activity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activities")
    .select("id, contact_id, deal_id, type, title, body, due_at, done_at, created_by, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(rowToActivity);
}

export async function listOpenTasks(): Promise<Activity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activities")
    .select("id, contact_id, deal_id, type, title, body, due_at, done_at, created_by, created_at")
    .eq("type", "task")
    .is("done_at", null)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return data.map(rowToActivity);
}

export async function createActivity(
  input: {
    contactId?: string;
    dealId?: string;
    type: ActivityType;
    title: string;
    body?: string;
    dueAt?: string;
  },
  actorId: string,
): Promise<boolean> {
  if (!input.contactId && !input.dealId) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("activities").insert({
    contact_id: input.contactId || null,
    deal_id: input.dealId || null,
    type: input.type,
    title: input.title.trim(),
    body: input.body?.trim() || null,
    due_at: input.dueAt || null,
    created_by: actorId,
  });
  return !error;
}

export async function completeTask(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("activities").update({ done_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
