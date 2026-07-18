import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { getLead, saveLeadScore } from "@/lib/crm/leads";
import { logAiCall } from "@/lib/audit";
import { alertError } from "@/lib/alert";
import { scoreLead } from "@/lib/crm/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const logPrompt = JSON.stringify({ leadId: id });
  try {
    const result = await scoreLead(lead);
    await saveLeadScore(id, result.score, result.rationale);
    await logAiCall({ userId: user.id, feature: "crm_score_lead", prompt: logPrompt, response: result });
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("crm lead scoring error:", err);
    await logAiCall({ userId: user.id, feature: "crm_score_lead", prompt: logPrompt, error: message });
    await alertError({ route: new URL(req.url).pathname, message, userId: user.id });
    return NextResponse.json({ error: "AI scoring failed. Please try again." }, { status: 500 });
  }
}
