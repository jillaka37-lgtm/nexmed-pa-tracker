import { NextResponse } from "next/server";
import { runOverdueScan } from "@/lib/pa-tracker/reminders";
import { alertError } from "@/lib/alert";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOverdueScan();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("pa-tracker reminder cron error:", err);
    await alertError({ route: "/api/pa-tracker/cron/reminders", message });
    return NextResponse.json({ error: "Reminder scan failed." }, { status: 500 });
  }
}
