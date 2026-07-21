import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { getOwnCase, listEvents } from "@/lib/pa-tracker/cases";
import { logAiCall } from "@/lib/audit";
import { alertError } from "@/lib/alert";
import type { CaseSummary } from "./generate";

type RunArgs = { caseSummary: CaseSummary; timelineText: string; body: unknown };

/** Shared plumbing for every AI case-action route: auth + ownership check
 * (via the same getOwnCase isolation used everywhere else in PA Tracker),
 * timeline loading, ai_log logging, and error handling/alerting. Each route
 * only supplies its own `run` callback. */
export async function runAiCaseAction<T>(
  req: Request,
  caseIdParam: string,
  feature: string,
  run: (args: RunArgs) => Promise<T>,
): Promise<NextResponse> {
  const user = await getUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const paCase = await getOwnCase(caseIdParam, user.id);
  if (!paCase) return NextResponse.json({ error: "Case not found." }, { status: 404 });

  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const events = await listEvents(paCase.id);
  const timelineText = events
    .slice()
    .reverse()
    .map((e) => `${e.action}${e.detail ? ": " + JSON.stringify(e.detail) : ""}`)
    .join("\n");

  const caseSummary: CaseSummary = {
    caseId: paCase.caseId,
    insurer: paCase.insurer,
    medication: paCase.medication,
    diagnosis: paCase.diagnosis,
    status: paCase.status,
  };

  const logPrompt = JSON.stringify({ caseSummary, body });

  try {
    const result = await run({ caseSummary, timelineText, body });
    await logAiCall({ userId: user.id, feature, prompt: logPrompt, response: result as unknown });
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`pa-tracker AI action (${feature}) error:`, err);
    await logAiCall({ userId: user.id, feature, prompt: logPrompt, error: message });
    await alertError({ route: new URL(req.url).pathname, message, userId: user.id });
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
