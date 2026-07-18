import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import type { Deal, DealStage } from "./types";

const DEAL_COLUMNS =
  "id, title, contact_id, company_id, stage_key, status, amount_cents, expected_close, lost_reason, stage_entered_at, created_at, updated_at";

function rowToDeal(data: Record<string, any>): Deal {
  return {
    id: data.id,
    title: data.title,
    contactId: data.contact_id,
    companyId: data.company_id,
    stageKey: data.stage_key,
    status: data.status,
    amountCents: data.amount_cents,
    expectedClose: data.expected_close,
    lostReason: data.lost_reason,
    stageEnteredAt: data.stage_entered_at,
    createdAt: data.created_at,
  };
}

export async function listDealStages(): Promise<DealStage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deal_stages")
    .select("key, label, position, is_won, is_lost")
    .order("position");
  if (error || !data) return [];
  return data.map((s) => ({ key: s.key, label: s.label, position: s.position, isWon: s.is_won, isLost: s.is_lost }));
}

export async function listDeals(): Promise<(Deal & { contactName: string | null })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(`${DEAL_COLUMNS}, contacts(full_name)`)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error || !data) return [];
  return data.map((row: any) => ({ ...rowToDeal(row), contactName: row.contacts?.full_name ?? null }));
}

export async function listDealsForContact(contactId: string): Promise<Deal[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(DEAL_COLUMNS)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToDeal);
}

export async function createDeal(
  input: { title: string; contactId: string; companyId?: string | null; amountCents?: number; expectedClose?: string },
  actorId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .insert({
      title: input.title.trim(),
      contact_id: input.contactId,
      company_id: input.companyId || null,
      amount_cents: input.amountCents ?? 0,
      expected_close: input.expectedClose || null,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

/** Moves a deal to a new stage, deriving deal.status from the stage's
 * is_won/is_lost flags and logging a stage_change activity — mirrors the
 * PA Tracker pattern of recording one timeline event per real change. */
export async function moveDealStage(
  dealId: string,
  stageKey: string,
  actorId: string,
  lostReason?: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const [{ data: deal }, { data: stage }] = await Promise.all([
    admin.from("deals").select("id, stage_key, contact_id").eq("id", dealId).maybeSingle(),
    admin.from("deal_stages").select("key, label, is_won, is_lost").eq("key", stageKey).maybeSingle(),
  ]);
  if (!deal || !stage) return false;
  if (deal.stage_key === stageKey) return true;

  const status = stage.is_won ? "won" : stage.is_lost ? "lost" : "open";
  const { error } = await admin
    .from("deals")
    .update({
      stage_key: stageKey,
      status,
      stage_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lost_reason: stage.is_lost ? lostReason?.trim() || null : null,
    })
    .eq("id", dealId);
  if (error) return false;

  await admin.from("activities").insert({
    deal_id: dealId,
    contact_id: deal.contact_id,
    type: "stage_change",
    title: `Moved to ${stage.label}`,
    body: stage.is_lost && lostReason ? `Reason: ${lostReason}` : null,
    created_by: actorId,
  });
  await logAction(actorId, "crm_deal_stage_changed", `${dealId}:${stageKey}`);
  return true;
}
