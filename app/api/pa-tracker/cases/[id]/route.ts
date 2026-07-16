import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { caseUpdateSchema } from "@/lib/pa-tracker/schema";
import { updateCase, deleteCase } from "@/lib/pa-tracker/cases";
import { alertError } from "@/lib/alert";

export async function PATCH(
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

  const parsed = caseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  try {
    const updated = await updateCase(id, user.id, parsed.data);
    if (!updated) return NextResponse.json({ error: "Case not found." }, { status: 404 });
    return NextResponse.json({ case: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("pa-tracker update case error:", err);
    await alertError({ route: `/api/pa-tracker/cases/${id}`, message, userId: user.id });
    return NextResponse.json({ error: "Couldn't update the case. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteCase(id, user.id);
  if (!ok) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
