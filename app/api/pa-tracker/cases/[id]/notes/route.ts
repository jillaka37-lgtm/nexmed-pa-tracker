import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser, isAdmin } from "@/lib/auth";
import { addNote } from "@/lib/pa-tracker/cases";

const noteSchema = z.object({ text: z.string().trim().min(1).max(2000) });

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

  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Note can't be empty." }, { status: 400 });
  }

  const ok = await addNote(id, user.id, parsed.data.text);
  if (!ok) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
