import { createAdminClient } from "@/lib/supabase/admin";
import type { Contact } from "./types";

const CONTACT_COLUMNS = "id, company_id, full_name, email, phone, source, notes, created_at";

function rowToContact(data: Record<string, any>): Contact {
  return {
    id: data.id,
    companyId: data.company_id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    source: data.source,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function listContacts(search?: string): Promise<(Contact & { companyName: string | null })[]> {
  const admin = createAdminClient();
  let query = admin
    .from("contacts")
    .select(`${CONTACT_COLUMNS}, companies(name)`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row: any) => ({ ...rowToContact(row), companyName: row.companies?.name ?? null }));
}

export async function getContact(id: string): Promise<(Contact & { companyName: string | null }) | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contacts")
    .select(`${CONTACT_COLUMNS}, companies(name)`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { ...rowToContact(data), companyName: (data as any).companies?.name ?? null };
}

export async function createContact(
  input: { fullName: string; email?: string; phone?: string; companyId?: string; notes?: string },
  actorId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contacts")
    .insert({
      full_name: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      company_id: input.companyId || null,
      notes: input.notes?.trim() || null,
      source: "manual",
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
