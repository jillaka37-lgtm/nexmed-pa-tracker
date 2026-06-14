import { Resend } from "resend";
import { formatPrice } from "./format";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "NexMed <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

const resend = apiKey ? new Resend(apiKey) : null;

/** Wraps content in NexMed-branded dark email markup. */
function shell(title: string, body: string) {
  return `
  <div style="background:#0A1628;padding:32px;font-family:Inter,Arial,sans-serif;color:#E8EDF5">
    <div style="max-width:560px;margin:0 auto;background:#0D1A2D;border:1px solid #1A3050;border-radius:12px;overflow:hidden">
      <div style="padding:24px 28px;border-bottom:1px solid #1A3050">
        <span style="font-size:20px;font-weight:700">
          <span style="color:#fff">Nex</span><span style="color:#00A8CC">Med</span>
        </span>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#00A8CC">${title}</h1>
        ${body}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #1A3050;color:#8899BB;font-size:12px">
        Your Health, Our Mission. · NexMed
      </div>
    </div>
  </div>`;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY missing — skipped "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

export async function sendContactNotification(msg: {
  name: string;
  email: string;
  message: string;
}) {
  if (!ADMIN_EMAIL) return;
  await send(
    ADMIN_EMAIL,
    `New contact message from ${msg.name}`,
    shell(
      "New contact message",
      `<p style="color:#E8EDF5">From <strong>${msg.name}</strong> (${msg.email})</p>
       <p style="color:#8899BB;white-space:pre-wrap">${msg.message}</p>`,
    ),
  );
}

export async function sendRefillNotification(r: {
  name: string;
  email: string;
  phone: string;
  medication: string;
  fulfilment: string;
}) {
  if (!ADMIN_EMAIL) return;
  await send(
    ADMIN_EMAIL,
    `New prescription refill request: ${r.medication}`,
    shell(
      "New refill request",
      `<table style="font-size:14px;color:#E8EDF5">
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Patient</td><td>${r.name}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Email</td><td>${r.email}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Phone</td><td>${r.phone}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Medication</td><td>${r.medication}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Fulfilment</td><td>${r.fulfilment}</td></tr>
       </table>
       <p style="color:#8899BB;margin-top:16px">Review the full request in your admin dashboard.</p>`,
    ),
  );
}

export async function sendRefillConfirmation(r: {
  to: string;
  name: string;
  medication: string;
}) {
  await send(
    r.to,
    "We received your refill request",
    shell(
      "Refill request received",
      `<p style="color:#E8EDF5">Hi ${r.name}, thanks. We've received your request to refill <strong>${r.medication}</strong>.</p>
       <p style="color:#8899BB;margin-top:12px">Our pharmacy team will review it and contact you shortly to confirm details, pricing, and pickup or delivery. If anything is urgent, please call us.</p>`,
    ),
  );
}

export async function sendOrderConfirmation(o: {
  to: string;
  items: { name: string; quantity: number; unit_amount_cents: number }[];
  amountCents: number;
  currency: string;
}) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="color:#E8EDF5;padding:4px 16px 4px 0">${i.name} × ${i.quantity}</td>
         <td style="color:#E8EDF5;text-align:right">${formatPrice(i.unit_amount_cents * i.quantity, o.currency)}</td></tr>`,
    )
    .join("");
  await send(
    o.to,
    "Your NexMed order is confirmed",
    shell(
      "Order confirmed",
      `<p style="color:#E8EDF5">Thanks for your order. Payment received, and here's what's on its way:</p>
       <table style="margin-top:12px;width:100%;font-size:14px">
         ${rows}
         <tr><td style="color:#8899BB;padding-top:10px;border-top:1px solid #1A3050">Total</td>
         <td style="color:#D4AF37;text-align:right;font-weight:700;padding-top:10px;border-top:1px solid #1A3050">${formatPrice(o.amountCents, o.currency)}</td></tr>
       </table>
       <p style="color:#8899BB;margin-top:16px">We'll be in touch with pickup or delivery details. Questions? Just reply to this email.</p>`,
    ),
  );
}

export async function sendBookingConfirmation(b: {
  to: string;
  name: string | null;
  serviceTitle: string;
  startAt: Date;
  amountCents: number;
  currency: string;
}) {
  const when = b.startAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });
  await send(
    b.to,
    "Your NexMed consultation is confirmed",
    shell(
      "Booking confirmed",
      `<p style="color:#E8EDF5">Hi ${b.name ?? "there"}, your consultation is booked and paid.</p>
       <table style="margin-top:12px;font-size:14px;color:#E8EDF5">
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Service</td><td>${b.serviceTitle}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">When</td><td>${when}</td></tr>
         <tr><td style="color:#8899BB;padding:4px 16px 4px 0">Paid</td><td>${formatPrice(b.amountCents, b.currency)}</td></tr>
       </table>
       <p style="color:#8899BB;margin-top:16px">We'll email your private meeting link before the session. You can also view it any time in your dashboard.</p>`,
    ),
  );
}

export async function sendMeetingLink(b: {
  to: string;
  name: string | null;
  serviceTitle: string;
  startAt: Date;
  meetingLink: string;
}) {
  const when = b.startAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });
  await send(
    b.to,
    "Your NexMed meeting link",
    shell(
      "Your meeting link is ready",
      `<p style="color:#E8EDF5">Hi ${b.name ?? "there"}, here's the link for your ${b.serviceTitle} on ${when}:</p>
       <p style="margin:18px 0">
         <a href="${b.meetingLink}" style="background:#00A8CC;color:#0A1628;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;display:inline-block">Join the consultation</a>
       </p>
       <p style="color:#8899BB;font-size:13px">${b.meetingLink}</p>`,
    ),
  );
}
