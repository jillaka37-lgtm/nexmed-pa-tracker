import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaOverdueReminder } from "./notify";
import { sendPaOverdueReminderSms } from "@/lib/sms";

const DEDUP_WINDOW_HOURS = 20;

/** Scans for overdue, unresolved cases and sends an email+SMS reminder to
 * the creator and assignee — skipping cases already reminded within the
 * dedup window, so overlapping/retried cron invocations don't double-send. */
export async function runOverdueScan(): Promise<{ scanned: number; notified: number }> {
  const admin = createAdminClient();

  const { data: overdue } = await admin
    .from("pa_cases")
    .select("id, case_id, created_by, assigned_to, due_at")
    .in("status", ["sent", "waiting"])
    .lt("due_at", new Date().toISOString());

  const cases = overdue ?? [];
  if (cases.length === 0) return { scanned: 0, notified: 0 };

  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recentReminders } = await admin
    .from("pa_case_events")
    .select("case_id")
    .eq("action", "reminder_sent")
    .in("case_id", cases.map((c) => c.id))
    .gt("created_at", cutoff);
  const alreadyRemindedIds = new Set((recentReminders ?? []).map((r) => r.case_id));

  const userIds = [
    ...new Set(cases.flatMap((c) => [c.created_by, c.assigned_to].filter(Boolean))),
  ] as string[];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email, phone").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let notified = 0;
  for (const c of cases) {
    if (alreadyRemindedIds.has(c.id)) continue;

    const daysOverdue = Math.floor((Date.now() - new Date(c.due_at).getTime()) / (1000 * 60 * 60 * 24));
    const targetIds = [...new Set([c.created_by, c.assigned_to].filter(Boolean))] as string[];

    for (const targetId of targetIds) {
      const profile = profileById.get(targetId);
      if (!profile) continue;
      if (profile.email) {
        await sendPaOverdueReminder({
          to: profile.email,
          name: profile.full_name,
          caseId: c.case_id,
          daysOverdue,
        });
      }
      if (profile.phone) {
        await sendPaOverdueReminderSms({ to: profile.phone, caseId: c.case_id, daysOverdue });
      }
    }

    await admin.from("pa_case_events").insert({
      case_id: c.id,
      actor: null,
      action: "reminder_sent",
      detail: { daysOverdue },
    });
    notified++;
  }

  return { scanned: cases.length, notified };
}
