import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser, isAdmin } from "@/lib/auth";
import { saveAiActionToTimeline } from "@/lib/pa-tracker/cases";

const saveSchema = z.object({ type: z.string().min(1), output: z.unknown() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI result." }, { status: 400 });
  }

  const ok = await saveAiActionToTimeline(id, user.id, parsed.data.type, parsed.data.output);
  if (!ok) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
