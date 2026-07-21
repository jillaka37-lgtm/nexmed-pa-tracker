import { createAdminClient } from "@/lib/supabase/admin";
import type { Patient, PatientProfile } from "./types";

// Raw Supabase row shape is intentionally untyped here — the function's own
// return type is what actually enforces field types for every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProfile(data: Record<string, any>): PatientProfile {
  return {
    userId: data.user_id,
    dateOfBirth: data.date_of_birth,
    allergies: data.allergies,
    conditions: data.conditions,
    preferredPharmacy: data.preferred_pharmacy,
    insuranceProvider: data.insurance_provider,
    insuranceMemberId: data.insurance_member_id,
    notes: data.notes,
    updatedAt: data.updated_at,
  };
}

export async function listPatients(search?: string): Promise<Patient[]> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("role", "client")
    .order("full_name");
  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, fullName: p.full_name, email: p.email, phone: p.phone }));
}

export async function getPatient(userId: string): Promise<Patient | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", userId)
    .eq("role", "client")
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, fullName: data.full_name, email: data.email, phone: data.phone };
}

export async function getPatientProfile(userId: string): Promise<PatientProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("patient_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function upsertPatientProfile(
  userId: string,
  input: {
    dateOfBirth?: string;
    allergies?: string;
    conditions?: string;
    preferredPharmacy?: string;
    insuranceProvider?: string;
    insuranceMemberId?: string;
    notes?: string;
  },
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("patient_profiles").upsert({
    user_id: userId,
    date_of_birth: input.dateOfBirth || null,
    allergies: input.allergies?.trim() || null,
    conditions: input.conditions?.trim() || null,
    preferred_pharmacy: input.preferredPharmacy?.trim() || null,
    insurance_provider: input.insuranceProvider?.trim() || null,
    insurance_member_id: input.insuranceMemberId?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  });
  return !error;
}
