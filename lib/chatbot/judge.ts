import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAdminClient } from "@/lib/supabase/admin";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const JUDGE_PROMPT = `You are an evaluation judge for an AI pharmacy assistant chatbot called NexMed.

You will receive:
- USER QUESTION: what the user asked
- RETRIEVED CONTEXT: documents retrieved from the knowledge base (may be empty)
- BOT ANSWER: what the chatbot replied

Score the bot answer on 3 dimensions, each from 1 to 5:

1. FAITHFULNESS (1-5): Did the answer stick strictly to the retrieved context without inventing facts?
   - 5: Every claim is supported by the context
   - 3: Minor additions not in context but not harmful
   - 1: Made up facts, prices, or services not in the context

2. RELEVANCE (1-5): Did the answer actually address what the user asked, completely?
   - 5: Directly and fully answered the question
   - 3: Partially answered or drifted slightly off-topic
   - 1: Did not answer the question at all

3. TONE (1-5): Does the answer match NexMed's brand voice — warm, clear, caring, professional?
   - 5: Perfect brand voice, concise and human
   - 3: Acceptable but too robotic or too casual
   - 1: Cold, off-brand, or inappropriate

Reply ONLY with valid JSON in this exact format, nothing else:
{"faithfulness":4,"relevance":5,"tone":4,"overall":4,"reason":"one sentence explanation"}`;

type JudgeScores = {
  faithfulness: number;
  relevance: number;
  tone: number;
  overall: number;
  reason: string;
};

export async function judgeResponse(opts: {
  messageId: string;
  userMessage: string;
  ragContext: string;
  botResponse: string;
}): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) return;

  try {
    const { text } = await generateText({
      model: openrouter("google/gemini-2.5-flash"),
      system: JUDGE_PROMPT,
      messages: [
        {
          role: "user",
          content: `USER QUESTION:\n${opts.userMessage}\n\nRETRIEVED CONTEXT:\n${opts.ragContext || "(none)"}\n\nBOT ANSWER:\n${opts.botResponse}`,
        },
      ],
      maxOutputTokens: 150,
    });

    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return;

    const scores: JudgeScores = JSON.parse(json);

    const admin = createAdminClient();
    await admin.from("chat_messages").update({
      score_faithfulness: scores.faithfulness,
      score_relevance: scores.relevance,
      score_tone: scores.tone,
      score_overall: scores.overall,
      score_reason: scores.reason,
    }).eq("id", opts.messageId);
  } catch {
    // Judge errors must never affect the user experience
  }
}
