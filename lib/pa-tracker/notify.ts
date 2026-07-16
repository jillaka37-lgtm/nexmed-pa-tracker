import { sendEmail, shell } from "@/lib/email";
import type { PaStatus } from "./schema";

export async function sendPaCaseAssigned(input: {
  to: string;
  name: string | null;
  caseId: string;
  insurer: string;
  medication: string;
}): Promise<void> {
  await sendEmail(
    input.to,
    `PA case assigned to you: ${input.caseId}`,
    shell(
      "A case was assigned to you",
      `<p style="color:#E8EDF5">Hi ${input.name ?? "there"}, you've been assigned a prior-authorization case.</p>
       <table style="margin-top:12px;font-size:14px;color:#E8EDF5">
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Case</td><td>${input.caseId}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Insurer</td><td>${input.insurer}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Medication</td><td>${input.medication}</td></tr>
       </table>`,
    ),
  );
}

export async function sendPaStatusChanged(input: {
  to: string;
  name: string | null;
  caseId: string;
  oldStatus: PaStatus;
  newStatus: PaStatus;
}): Promise<void> {
  await sendEmail(
    input.to,
    `PA case ${input.caseId} is now ${input.newStatus}`,
    shell(
      "Case status updated",
      `<p style="color:#E8EDF5">Hi ${input.name ?? "there"}, case <strong>${input.caseId}</strong> changed from
       <strong>${input.oldStatus}</strong> to <strong>${input.newStatus}</strong>.</p>`,
    ),
  );
}

export async function sendPaOverdueReminder(input: {
  to: string;
  name: string | null;
  caseId: string;
  daysOverdue: number;
}): Promise<void> {
  await sendEmail(
    input.to,
    `Follow-up needed: PA case ${input.caseId} is overdue`,
    shell(
      "Overdue follow-up",
      `<p style="color:#E8EDF5">Hi ${input.name ?? "there"}, case <strong>${input.caseId}</strong> is
       <strong>${input.daysOverdue} day${input.daysOverdue === 1 ? "" : "s"}</strong> past its follow-up date.</p>
       <p style="color:#8899BB;margin-top:12px">Check the PA Tracker dashboard for details.</p>`,
    ),
  );
}
