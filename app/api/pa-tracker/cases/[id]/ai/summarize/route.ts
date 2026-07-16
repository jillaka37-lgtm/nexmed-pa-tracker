import { runAiCaseAction } from "@/lib/pa-tracker/ai/handler";
import { summarizeCaseHistory } from "@/lib/pa-tracker/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runAiCaseAction(req, id, "pa_summarize", async ({ caseSummary, timelineText }) =>
    summarizeCaseHistory(caseSummary, timelineText),
  );
}
