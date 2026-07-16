import { runAiCaseAction } from "@/lib/pa-tracker/ai/handler";
import { draftPrescriberMessage } from "@/lib/pa-tracker/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runAiCaseAction(req, id, "pa_draft_prescriber_message", async ({ caseSummary }) =>
    draftPrescriberMessage(caseSummary),
  );
}
