import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { generateDraft } from "@/lib/prior-auth/generate";
import { saveDraft } from "@/lib/prior-auth/store";
import { checkAndIncrementUsage, RateLimitError } from "@/lib/prior-auth/rate-limit";
import { logAction, logAiCall } from "@/lib/prior-auth/audit";
import { alertError } from "@/lib/alert";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    await checkAndIncrementUsage(user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  try {
    const { intake, output } = await generateDraft(body);
    const id = await saveDraft(intake, output, user.id);

    await Promise.all([
      logAction(user.id, "prior_auth_draft_created", id),
      logAiCall({
        userId: user.id,
        feature: "prior_auth_draft",
        prompt: JSON.stringify(intake),
        response: output,
      }),
    ]);

    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("prior-auth generate error:", err);

    await Promise.all([
      alertError({ route: "/api/prior-auth/generate", message, userId: user.id }),
      logAiCall({
        userId: user.id,
        feature: "prior_auth_draft",
        prompt: JSON.stringify(body),
        error: message,
      }),
    ]);

    return NextResponse.json(
      { error: "Couldn't generate the draft. Please try again." },
      { status: 500 },
    );
  }
}
