import { createAdminClient } from "@/lib/supabase/admin";
import type { InsuranceCompany } from "./types";

function rowToInsurer(data: Record<string, any>): InsuranceCompany {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    claimsEmail: data.claims_email,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function listInsuranceCompanies(): Promise<InsuranceCompany[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("insurance_companies").select("*").order("name");
  if (error || !data) return [];
  return data.map(rowToInsurer);
}

export async function createInsuranceCompany(input: {
  name: string;
  phone?: string;
  claimsEmail?: string;
  notes?: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("insurance_companies")
    .insert({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      claims_email: input.claimsEmail?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
