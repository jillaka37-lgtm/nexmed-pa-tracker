import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { caseCreateSchema } from "@/lib/pa-tracker/schema";
import { createCase } from "@/lib/pa-tracker/cases";
import { checkAndIncrementUsage, RateLimitError } from "@/lib/pa-tracker/rate-limit";
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

  const parsed = caseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid case details." }, { status: 400 });
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
    const id = await createCase(parsed.data, user.id);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("pa-tracker create case error:", err);
    await alertError({ route: "/api/pa-tracker/cases", message, userId: user.id });
    return NextResponse.json({ error: "Couldn't create the case. Please try again." }, { status: 500 });
  }
}
