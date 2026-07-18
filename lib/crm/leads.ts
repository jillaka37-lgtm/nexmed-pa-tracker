import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import type { Lead, LeadStatus } from "./types";

const LEAD_COLUMNS =
  "id, source, name, email, phone, message, status, contact_id, ai_score, ai_score_rationale, ai_scored_at, created_at";

function rowToLead(data: Record<string, any>): Lead {
  return {
    id: data.id,
    source: data.source,
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    status: data.status,
    contactId: data.contact_id,
    aiScore: data.ai_score,
    aiScoreRationale: data.ai_score_rationale,
    aiScoredAt: data.ai_scored_at,
    createdAt: data.created_at,
  };
}

export async function listLeads(): Promise<Lead[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(rowToLead);
}

export async function getLead(id: string): Promise<Lead | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToLead(data);
}

export async function setLeadStatus(id: string, status: LeadStatus, actorId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("leads").update({ status }).eq("id", id);
  if (error) return false;
  await logAction(actorId, "crm_lead_status_changed", `${id}:${status}`);
  return true;
}

export async function saveLeadScore(
  id: string,
  score: number,
  rationale: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ ai_score: score, ai_score_rationale: rationale, ai_scored_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** Converts a lead into a contact (find-or-create by email), links it back
 * to the lead, marks the lead converted, and logs the original message as
 * the contact's first note-type activity. Optionally opens a deal. */
export async function convertLead(
  leadId: string,
  actorId: string,
  input: { companyName?: string; dealTitle?: string; dealAmountCents?: number },
): Promise<{ contactId: string; dealId: string | null } | null> {
  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, source, name, email, phone, message, contact_id")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return null;
  if (lead.contact_id) return { contactId: lead.contact_id, dealId: null };

  let companyId: string | null = null;
  if (input.companyName?.trim()) {
    // Escape LIKE wildcards before using the name in an ilike lookup.
    const escaped = input.companyName.trim().replace(/[%_]/g, (m) => `\\${m}`);
    const { data: existingCompany } = await admin
      .from("companies")
      .select("id")
      .ilike("name", escaped)
      .maybeSingle();
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: newCompany } = await admin
        .from("companies")
        .insert({ name: input.companyName.trim() })
        .select("id")
        .single();
      companyId = newCompany?.id ?? null;
    }
  }

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .insert({
      company_id: companyId,
      full_name: lead.name ?? lead.email ?? "Unknown",
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (contactError || !contact) return null;

  await admin.from("leads").update({ status: "converted", contact_id: contact.id }).eq("id", leadId);

  if (lead.message) {
    await admin.from("activities").insert({
      contact_id: contact.id,
      type: "note",
      title: "Original inquiry",
      body: lead.message,
      created_by: actorId,
    });
  }

  let dealId: string | null = null;
  if (input.dealTitle?.trim()) {
    const { data: deal } = await admin
      .from("deals")
      .insert({
        title: input.dealTitle.trim(),
        contact_id: contact.id,
        company_id: companyId,
        amount_cents: input.dealAmountCents ?? 0,
        created_by: actorId,
      })
      .select("id")
      .single();
    dealId = deal?.id ?? null;
  }

  await logAction(actorId, "crm_lead_converted", leadId);
  return { contactId: contact.id, dealId };
}
