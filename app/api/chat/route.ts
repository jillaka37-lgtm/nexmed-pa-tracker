import { NextResponse, after } from "next/server";
import { runBrain } from "@/lib/chatbot/brain";
import { getOrCreateSession } from "@/lib/chatbot/memory";
import { judgeResponse } from "@/lib/chatbot/judge";
import { captureLead } from "@/lib/chatbot/tools/lead";
import { Resend } from "resend";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { message?: string; sessionId?: string; channel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const channel = (body.channel as "web" | "widget") ?? "web";
  const sessionId = await getOrCreateSession({ sessionId: body.sessionId, channel });

  const liveAgentKeywords = /live agent|human agent|speak to (a |someone|)(human|person|agent|staff|team|representative|rep)|talk to (a |)(human|person|agent|staff|team)|real person|connect me|operator|customer (support|service|care)/i;
  const userWantsAgent = liveAgentKeywords.test(message);

  try {
    const { text, liveAgentRequested, contactInfo, messageId, ragContext } = await runBrain({ sessionId, userMessage: message, channel });
    const isLiveAgent = liveAgentRequested || userWantsAgent;

    if (contactInfo?.name && contactInfo?.email) {
      await captureLead(sessionId, contactInfo);
    }

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_xxx") {
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (isLiveAgent) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "NexMed <onboarding@resend.dev>",
          to: process.env.ADMIN_EMAIL ?? "jillaka37@gmail.com",
          subject: "⚡ Live Agent Requested — NexMed Chat",
          html: `
            <h2>A customer requested a live agent</h2>
            <p><strong>Their message:</strong> ${message}</p>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p><strong>Channel:</strong> ${channel}</p>
            <p>Please follow up as soon as possible.</p>
          `,
        }).catch(() => null);
      }

      if (contactInfo?.name && contactInfo?.email) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "NexMed <onboarding@resend.dev>",
          to: process.env.ADMIN_EMAIL ?? "jillaka37@gmail.com",
          subject: "📋 New Lead — NexMed Chat",
          html: `
            <h2>A customer left their contact details</h2>
            <table style="border-collapse:collapse;width:100%;max-width:480px">
              <tr><td style="padding:8px;font-weight:bold;border:1px solid #e5e7eb">Name</td><td style="padding:8px;border:1px solid #e5e7eb">${contactInfo.name}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border:1px solid #e5e7eb">Email</td><td style="padding:8px;border:1px solid #e5e7eb"><a href="mailto:${contactInfo.email}">${contactInfo.email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;border:1px solid #e5e7eb">Their message</td><td style="padding:8px;border:1px solid #e5e7eb">${message}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border:1px solid #e5e7eb">Channel</td><td style="padding:8px;border:1px solid #e5e7eb">${channel}</td></tr>
            </table>
            <p style="margin-top:16px">Follow up with them at <a href="mailto:${contactInfo.email}">${contactInfo.email}</a>.</p>
          `,
        }).catch(() => null);
      }
    }

    // Run LLM judge after response is sent — zero latency impact on the user
    if (messageId) {
      after(() =>
        judgeResponse({ messageId, userMessage: message, ragContext, botResponse: text })
      );
    }

    return NextResponse.json({ text, sessionId, messageId, liveAgentRequested: isLiveAgent, contactCollected: !!contactInfo });
  } catch (err) {
    console.error("[chat] error:", err);
    const fallback = userWantsAgent
      ? "Our team has been notified and will reach out to you shortly. You can also contact us directly at info@nexmed.com or visit our contact page."
      : "I'm having a little trouble right now. Please try again in a moment, or visit our contact page if you need immediate help.";
    return NextResponse.json({ text: fallback, sessionId, liveAgentRequested: userWantsAgent, contactCollected: false });
  }
}
