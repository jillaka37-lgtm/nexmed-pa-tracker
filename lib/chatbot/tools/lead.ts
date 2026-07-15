import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const captureLeadSchema = z.object({
  name: z.string().optional().describe("Full name of the visitor"),
  email: z.string().email().optional().describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  notes: z.string().optional().describe("Reason for interest or additional notes"),
});

export async function captureLead(
  sessionId: string,
  params: z.infer<typeof captureLeadSchema>,
): Promise<string> {
  const admin = createAdminClient();
  const { error } = await admin.from("chat_leads").insert({
    session_id: sessionId,
    name: params.name ?? null,
    email: params.email ?? null,
    phone: params.phone ?? null,
    notes: params.notes ?? null,
  });

  if (error) {
    console.error("[captureLead] error:", error.message);
    return "I wasn't able to save your details right now. Please try contacting us directly at hello@nexmed.com.";
  }

  return `Thank you${params.name ? `, ${params.name}` : ""}! I've noted your details and a member of our team will be in touch with you shortly. Is there anything else I can help you with today?`;
}
