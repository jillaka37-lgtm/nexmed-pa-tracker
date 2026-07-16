import { runAiCaseAction } from "@/lib/pa-tracker/ai/handler";
import { suggestNextAction } from "@/lib/pa-tracker/ai/generate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runAiCaseAction(req, id, "pa_suggest_action", async ({ caseSummary, timelineText }) =>
    suggestNextAction(caseSummary, timelineText),
  );
}
