"use server";

import { revalidatePath } from "next/cache";
import { getUser, isAdmin } from "@/lib/auth";
import { upsertPatientProfile } from "@/lib/crm/patients";
import { createPrescriber } from "@/lib/crm/prescribers";
import { createInsuranceCompany } from "@/lib/crm/insurers";
import { createPharmacyContact } from "@/lib/crm/pharmacyContacts";
import { createPatientActivity, completePatientActivity } from "@/lib/crm/patientActivities";
import type { PatientActivityType } from "@/lib/crm/types";
import type { CrmState } from "./actions";

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const user = await getUser();
  if (!user || !(await isAdmin())) return { error: "Not authorized." };
  return { userId: user.id };
}

export async function updatePatientProfileAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return { ok: false, error: "Missing patient." };

  const ok = await upsertPatientProfile(userId, {
    dateOfBirth: String(formData.get("date_of_birth") ?? ""),
    allergies: String(formData.get("allergies") ?? ""),
    conditions: String(formData.get("conditions") ?? ""),
    preferredPharmacy: String(formData.get("preferred_pharmacy") ?? ""),
    insuranceProvider: String(formData.get("insurance_provider") ?? ""),
    insuranceMemberId: String(formData.get("insurance_member_id") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!ok) return { ok: false, error: "Couldn't save patient profile." };
  revalidatePath(`/crm/patients/${userId}`);
  return { ok: true, message: "Patient profile saved." };
}

export async function createPrescriberAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, error: "Name is required." };

  const id = await createPrescriber({
    fullName,
    specialty: String(formData.get("specialty") ?? ""),
    clinicName: String(formData.get("clinic_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    fax: String(formData.get("fax") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!id) return { ok: false, error: "Couldn't add prescriber." };
  revalidatePath("/crm/prescribers");
  return { ok: true, message: "Prescriber added." };
}

export async function createInsuranceCompanyAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const id = await createInsuranceCompany({
    name,
    phone: String(formData.get("phone") ?? ""),
    claimsEmail: String(formData.get("claims_email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!id) return { ok: false, error: "Couldn't add insurance company." };
  revalidatePath("/crm/insurance");
  return { ok: true, message: "Insurance company added." };
}

export async function createPharmacyContactAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, error: "Name is required." };

  const id = await createPharmacyContact({
    fullName,
    roleTitle: String(formData.get("role_title") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!id) return { ok: false, error: "Couldn't add contact." };
  revalidatePath("/crm/pharmacy-contacts");
  return { ok: true, message: "Contact added." };
}

export async function createPatientActivityAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const userId = String(formData.get("user_id") ?? "");
  const type = String(formData.get("type") ?? "note") as PatientActivityType;
  const title = String(formData.get("title") ?? "").trim();
  if (!userId || !title) return { ok: false, error: "Missing patient or title." };

  const ok = await createPatientActivity(
    {
      userId,
      type,
      title,
      body: String(formData.get("body") ?? ""),
      dueAt: String(formData.get("due_at") ?? "") || undefined,
      remindAt: String(formData.get("remind_at") ?? "") || undefined,
    },
    auth.userId,
  );
  if (!ok) return { ok: false, error: "Couldn't add." };
  revalidatePath(`/crm/patients/${userId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm/notes");
  revalidatePath("/crm/reminders");
  return { ok: true, message: "Added." };
}

export async function completePatientActivityAction(_prev: CrmState, formData: FormData): Promise<CrmState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = String(formData.get("activity_id") ?? "");
  if (!id) return { ok: false, error: "Missing item." };
  const ok = await completePatientActivity(id);
  if (!ok) return { ok: false, error: "Couldn't complete." };
  revalidatePath("/crm/tasks");
  revalidatePath("/crm/reminders");
  return { ok: true };
}
