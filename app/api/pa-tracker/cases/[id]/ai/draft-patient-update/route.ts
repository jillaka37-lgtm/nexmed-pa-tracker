import { runAiCaseAction } from "@/lib/pa-tracker/ai/handler";
import { draftPatientUpdate } from "@/lib/pa-tracker/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runAiCaseAction(req, id, "pa_draft_patient_update", async ({ caseSummary }) =>
    draftPatientUpdate(caseSummary),
  );
}
