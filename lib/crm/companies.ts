import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "./types";

function rowToCompany(data: Record<string, any>): Company {
  return {
    id: data.id,
    name: data.name,
    industry: data.industry,
    phone: data.phone,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function listCompanies(): Promise<(Company & { contactCount: number; dealCount: number })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("id, name, industry, phone, notes, created_at, contacts(count), deals(count)")
    .order("name");
  if (error || !data) return [];
  return data.map((row: any) => ({
    ...rowToCompany(row),
    contactCount: row.contacts?.[0]?.count ?? 0,
    dealCount: row.deals?.[0]?.count ?? 0,
  }));
}

export async function createCompany(input: { name: string; industry?: string; phone?: string; notes?: string }): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .insert({
      name: input.name.trim(),
      industry: input.industry?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
