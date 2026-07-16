import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

async function send(to: string, body: string) {
  if (!client || !fromNumber) {
    console.warn(`[sms] Twilio not configured — skipped SMS to ${to}: "${body}"`);
    return;
  }
  try {
    await client.messages.create({ to, from: fromNumber, body });
  } catch (err) {
    console.error("[sms] send failed:", err);
  }
}

export async function sendPaOverdueReminderSms(input: {
  to: string;
  caseId: string;
  daysOverdue: number;
}): Promise<void> {
  await send(
    input.to,
    `NexMed PA Tracker: case ${input.caseId} is ${input.daysOverdue} day(s) overdue for follow-up. Check your dashboard.`,
  );
}

export async function sendPaStatusChangedSms(input: {
  to: string;
  caseId: string;
  newStatus: string;
}): Promise<void> {
  await send(input.to, `NexMed PA Tracker: case ${input.caseId} is now ${input.newStatus}.`);
}
