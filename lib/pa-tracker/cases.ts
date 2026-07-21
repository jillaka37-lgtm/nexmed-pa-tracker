import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { sendPaCaseAssigned, sendPaStatusChanged } from "./notify";
import { sendPaStatusChangedSms } from "@/lib/sms";
import type { CaseCreateInput, CaseUpdateInput, PaStatus } from "./schema";

async function getContact(
  userId: string,
): Promise<{ email: string; name: string | null; phone: string | null } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.email) return null;
  return { email: data.email, name: data.full_name, phone: data.phone };
}

export type PaCase = {
  id: string;
  caseId: string;
  insurer: string;
  medication: string;
  diagnosis: string | null;
  status: PaStatus;
  createdBy: string;
  assignedTo: string | null;
  dueAt: string | null;
  lastActionAt: string;
  createdAt: string;
};

const CASE_COLUMNS =
  "id, case_id, insurer, medication, diagnosis, status, created_by, assigned_to, due_at, last_action_at, created_at";

// Raw Supabase row shape is intentionally untyped here — the function's own
// return type is what actually enforces field types for every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCase(data: Record<string, any>): PaCase {
  return {
    id: data.id,
    caseId: data.case_id,
    insurer: data.insurer,
    medication: data.medication,
    diagnosis: data.diagnosis,
    status: data.status,
    createdBy: data.created_by,
    assignedTo: data.assigned_to,
    dueAt: data.due_at,
    lastActionAt: data.last_action_at,
    createdAt: data.created_at,
  };
}

async function addEvent(
  caseId: string,
  actor: string | null,
  action: string,
  detail?: Record<string, unknown>,
) {
  const admin = createAdminClient();
  await admin.from("pa_case_events").insert({
    case_id: caseId,
    actor,
    action,
    detail: detail ?? null,
  });
}

/** Only returns the case if it belongs to or is assigned to `userId` —
 * enforces isolation at the application layer, independent of the DB RLS
 * policy (same defense-in-depth pattern as AuthDraft's per-creator model). */
export async function getOwnCase(id: string, userId: string): Promise<PaCase | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .select(CASE_COLUMNS)
    .eq("id", id)
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCase(data);
}

export async function listCases(userId: string): Promise<PaCase[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .select(CASE_COLUMNS)
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map(rowToCase);
}

export async function createCase(input: CaseCreateInput, createdBy: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .insert({
      case_id: input.caseId,
      insurer: input.insurer,
      medication: input.medication,
      diagnosis: input.diagnosis ?? null,
      due_at: input.dueAt ?? null,
      assigned_to: input.assignedTo ?? null,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create case: ${error?.message}`);
  }

  await addEvent(data.id, createdBy, "created", { caseId: input.caseId });
  if (input.assignedTo) {
    await addEvent(data.id, createdBy, "assigned", { to: input.assignedTo });
    const contact = await getContact(input.assignedTo);
    if (contact) {
      await sendPaCaseAssigned({
        to: contact.email,
        name: contact.name,
        caseId: input.caseId,
        insurer: input.insurer,
        medication: input.medication,
      });
    }
  }
  return data.id;
}

/** Applies a status/assignment/due-date update to a case the actor can see
 * (creator or assignee), recording one timeline event per changed field. */
export async function updateCase(
  id: string,
  actorId: string,
  input: CaseUpdateInput,
): Promise<PaCase | null> {
  const existing = await getOwnCase(id, actorId);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status !== undefined) patch.status = input.status;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.dueAt !== undefined) patch.due_at = input.dueAt;
  if (input.status !== undefined || input.assignedTo !== undefined) {
    patch.last_action_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .update(patch)
    .eq("id", id)
    .select(CASE_COLUMNS)
    .single();

  if (error || !data) return null;

  if (input.status !== undefined && input.status !== existing.status) {
    await addEvent(id, actorId, "status_changed", { from: existing.status, to: input.status });

    // Only notify on resolution — not every hop — to avoid noise.
    if (input.status === "approved" || input.status === "denied") {
      const notifyTargets = [...new Set([existing.createdBy, existing.assignedTo].filter(Boolean))] as string[];
      for (const targetId of notifyTargets) {
        const contact = await getContact(targetId);
        if (contact) {
          await sendPaStatusChanged({
            to: contact.email,
            name: contact.name,
            caseId: existing.caseId,
            oldStatus: existing.status,
            newStatus: input.status,
          });
          if (contact.phone) {
            await sendPaStatusChangedSms({
              to: contact.phone,
              caseId: existing.caseId,
              newStatus: input.status,
            });
          }
        }
      }
    }
  }
  if (input.assignedTo !== undefined && input.assignedTo !== existing.assignedTo) {
    await addEvent(id, actorId, "assigned", { to: input.assignedTo });
    if (input.assignedTo) {
      const contact = await getContact(input.assignedTo);
      if (contact) {
        await sendPaCaseAssigned({
          to: contact.email,
          name: contact.name,
          caseId: existing.caseId,
          insurer: existing.insurer,
          medication: existing.medication,
        });
      }
    }
  }

  return rowToCase(data);
}

/** Only the creator may delete (mirrors the DB RLS delete policy). */
export async function deleteCase(id: string, actorId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .delete()
    .eq("id", id)
    .eq("created_by", actorId)
    .select("id")
    .maybeSingle();

  const ok = !error && !!data;
  if (ok) await logAction(actorId, "pa_case_deleted", id);
  return ok;
}

/** Adds a note to a case the actor can see (creator or assignee). Returns
 * false if the case isn't visible to them. */
export async function addNote(caseId: string, actorId: string, text: string): Promise<boolean> {
  const existing = await getOwnCase(caseId, actorId);
  if (!existing) return false;
  await addEvent(caseId, actorId, "note_added", { text });
  return true;
}

/** Overdue: due_at in the past and still in an unresolved status, visible to
 * this user (creator or assignee). Resolved cases (approved/denied) never
 * show up here even with a past due_at. */
export async function listOverdueCases(userId: string): Promise<PaCase[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pa_cases")
    .select(CASE_COLUMNS)
    .in("status", ["sent", "waiting"])
    .lt("due_at", new Date().toISOString())
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .order("due_at", { ascending: true });

  if (error || !data) return [];
  return data.map(rowToCase);
}

/** Saves a reviewed AI suggestion to the timeline. Staff review before
 * saving — nothing from the AI actions is auto-persisted. */
export async function saveAiActionToTimeline(
  caseId: string,
  actorId: string,
  type: string,
  output: unknown,
): Promise<boolean> {
  const existing = await getOwnCase(caseId, actorId);
  if (!existing) return false;
  await addEvent(caseId, actorId, "ai_action", { type, output });
  return true;
}

export async function listEvents(caseId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pa_case_events")
    .select("id, actor, action, detail, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export { addEvent as addCaseEvent };
