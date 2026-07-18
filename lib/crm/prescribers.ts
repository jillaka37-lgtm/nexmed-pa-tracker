import { createAdminClient } from "@/lib/supabase/admin";
import type { Prescriber } from "./types";

function rowToPrescriber(data: Record<string, any>): Prescriber {
  return {
    id: data.id,
    fullName: data.full_name,
    specialty: data.specialty,
    clinicName: data.clinic_name,
    phone: data.phone,
    email: data.email,
    fax: data.fax,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function listPrescribers(): Promise<Prescriber[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("prescribers").select("*").order("full_name");
  if (error || !data) return [];
  return data.map(rowToPrescriber);
}

export async function createPrescriber(input: {
  fullName: string;
  specialty?: string;
  clinicName?: string;
  phone?: string;
  email?: string;
  fax?: string;
  notes?: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prescribers")
    .insert({
      full_name: input.fullName.trim(),
      specialty: input.specialty?.trim() || null,
      clinic_name: input.clinicName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      fax: input.fax?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
