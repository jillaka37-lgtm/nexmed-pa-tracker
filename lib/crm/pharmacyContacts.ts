import { createAdminClient } from "@/lib/supabase/admin";
import type { PharmacyContact } from "./types";

// Raw Supabase row shape is intentionally untyped here — the function's own
// return type is what actually enforces field types for every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToContact(data: Record<string, any>): PharmacyContact {
  return {
    id: data.id,
    fullName: data.full_name,
    roleTitle: data.role_title,
    organization: data.organization,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function listPharmacyContacts(): Promise<PharmacyContact[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("pharmacy_contacts").select("*").order("full_name");
  if (error || !data) return [];
  return data.map(rowToContact);
}

export async function createPharmacyContact(input: {
  fullName: string;
  roleTitle?: string;
  organization?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pharmacy_contacts")
    .insert({
      full_name: input.fullName.trim(),
      role_title: input.roleTitle?.trim() || null,
      organization: input.organization?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
