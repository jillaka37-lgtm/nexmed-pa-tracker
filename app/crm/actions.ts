"use server";

import { revalidatePath } from "next/cache";
import { getUser, isAdmin } from "@/lib/auth";
import { convertLead, setLeadStatus } from "@/lib/crm/leads";
import { createContact } from "@/lib/crm/contacts";
import { createCompany } from "@/lib/crm/companies";
import { createDeal, moveDealStage } from "@/lib/crm/deals";
import { createActivity, completeTask } from "@/lib/crm/activities";
import type { ActivityType, LeadStatus } from "@/lib/crm/types";

export type CrmState = { ok: boolean; error?: string; message?: string };

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const user = await getUser();
  if (!user || !(await isAdmin())) return { error: "Not authorized." };
  return { userId: user.id };
}

export async function convertLeadAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const leadId = String(formData.get("lead_id") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const dealTitle = String(formData.get("deal_title") ?? "").trim();
  const dealAmount = Number(formData.get("deal_amount") ?? 0);
  if (!leadId) return { ok: false, error: "Missing lead." };

  const result = await convertLead(leadId, auth.userId, {
    companyName: companyName || undefined,
    dealTitle: dealTitle || undefined,
    dealAmountCents: dealTitle && dealAmount > 0 ? Math.round(dealAmount * 100) : undefined,
  });
  if (!result) return { ok: false, error: "Couldn't convert this lead." };

  revalidatePath("/crm");
  revalidatePath("/crm/contacts");
  revalidatePath("/crm/deals");
  return { ok: true, message: "Lead converted to a contact." };
}

export async function setLeadStatusAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const leadId = String(formData.get("lead_id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (!leadId || !status) return { ok: false, error: "Missing lead or status." };

  const ok = await setLeadStatus(leadId, status, auth.userId);
  if (!ok) return { ok: false, error: "Couldn't update lead status." };
  revalidatePath("/crm");
  return { ok: true };
}

export async function createCompanyAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Company name is required." };

  const id = await createCompany({
    name,
    industry: String(formData.get("industry") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!id) return { ok: false, error: "Couldn't create company." };
  revalidatePath("/crm/companies");
  return { ok: true, message: "Company added." };
}

export async function createContactAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, error: "Name is required." };

  const id = await createContact(
    {
      fullName,
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      companyId: String(formData.get("company_id") ?? "") || undefined,
      notes: String(formData.get("notes") ?? ""),
    },
    auth.userId,
  );
  if (!id) return { ok: false, error: "Couldn't create contact." };
  revalidatePath("/crm/contacts");
  return { ok: true, message: "Contact added." };
}

export async function createDealAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  const contactId = String(formData.get("contact_id") ?? "");
  if (!title || !contactId) return { ok: false, error: "Title and contact are required." };

  const amount = Number(formData.get("amount") ?? 0);
  const id = await createDeal(
    {
      title,
      contactId,
      companyId: String(formData.get("company_id") ?? "") || undefined,
      amountCents: amount > 0 ? Math.round(amount * 100) : 0,
      expectedClose: String(formData.get("expected_close") ?? "") || undefined,
    },
    auth.userId,
  );
  if (!id) return { ok: false, error: "Couldn't create deal." };
  revalidatePath("/crm/deals");
  revalidatePath(`/crm/contacts/${contactId}`);
  return { ok: true, message: "Deal created." };
}

export async function moveDealStageAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const dealId = String(formData.get("deal_id") ?? "");
  const stageKey = String(formData.get("stage_key") ?? "");
  const lostReason = String(formData.get("lost_reason") ?? "");
  if (!dealId || !stageKey) return { ok: false, error: "Missing deal or stage." };

  const ok = await moveDealStage(dealId, stageKey, auth.userId, lostReason);
  if (!ok) return { ok: false, error: "Couldn't move deal." };
  revalidatePath("/crm/deals");
  return { ok: true };
}

export async function createActivityAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const contactId = String(formData.get("contact_id") ?? "") || undefined;
  const dealId = String(formData.get("deal_id") ?? "") || undefined;
  const type = String(formData.get("type") ?? "note") as ActivityType;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };
  const dueAtRaw = String(formData.get("due_at") ?? "");

  const ok = await createActivity(
    {
      contactId,
      dealId,
      type,
      title,
      body: String(formData.get("body") ?? ""),
      dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : undefined,
    },
    auth.userId,
  );
  if (!ok) return { ok: false, error: "Couldn't add activity." };
  if (contactId) revalidatePath(`/crm/contacts/${contactId}`);
  revalidatePath("/crm");
  return { ok: true, message: "Added." };
}

export async function completeTaskAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = String(formData.get("activity_id") ?? "");
  if (!id) return { ok: false, error: "Missing task." };
  const ok = await completeTask(id);
  if (!ok) return { ok: false, error: "Couldn't complete task." };
  revalidatePath("/crm");
  return { ok: true };
}
