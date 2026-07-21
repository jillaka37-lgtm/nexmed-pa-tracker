import { runAiCaseAction } from "@/lib/pa-tracker/ai/handler";
import { explainRejection } from "@/lib/pa-tracker/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runAiCaseAction(req, id, "pa_explain_rejection", async ({ caseSummary, body }) => {
    const rawText = (body as { rejectionCodeText?: unknown } | null)?.rejectionCodeText;
    const rejectionCodeText = typeof rawText === "string" ? rawText : "";
    return explainRejection(caseSummary, rejectionCodeText);
  });
}
