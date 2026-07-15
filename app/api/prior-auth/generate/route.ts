import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { generateDraft } from "@/lib/prior-auth/generate";
import { saveDraft } from "@/lib/prior-auth/store";

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
    const { intake, output } = await generateDraft(body);
    const id = await saveDraft(intake, output, user.id);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("prior-auth generate error:", err);
    return NextResponse.json(
      { error: "Couldn't generate the draft. Please try again." },
      { status: 500 },
    );
  }
}
