/**
 * Seed the chat_documents table with NexMed content from lib/content.ts.
 * Run with: npx tsx scripts/seed-chatbot-docs.ts
 *
 * Requires OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { google } from "@ai-sdk/google";
import { embed } from "ai";
import {
  faqs,
  defaultServices,
  pharmacyServices,
  medicationSafety,
  medicationCategories,
  businessInfo,
  ELEVATOR_PITCH,
  USP,
  howItWorks,
  insuranceInfo,
} from "../lib/content";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");

type Doc = { title: string; content: string; metadata?: Record<string, string> };

function buildDocs(): Doc[] {
  const docs: Doc[] = [];

  docs.push({
    title: "About NexMed",
    content: `${ELEVATOR_PITCH}\n\n${USP}`,
    metadata: { category: "about" },
  });

  docs.push({
    title: "How it works",
    content: howItWorks.map((s) => `Step ${s.step}: ${s.title} — ${s.body}`).join("\n"),
    metadata: { category: "how-it-works" },
  });

  docs.push({
    title: "Contact & business hours",
    content: [
      `Email: ${businessInfo.email}`,
      `Phone: ${businessInfo.phone}`,
      `Address: ${businessInfo.address}`,
      "Business hours:",
      ...businessInfo.hours.map((h) => `  ${h.day}: ${h.time}`),
    ].join("\n"),
    metadata: { category: "contact" },
  });

  for (const s of defaultServices) {
    docs.push({
      title: `Service: ${s.title}`,
      content: `${s.description}\nDuration: ${s.duration_min} minutes\nPrice: $${(s.price_cents / 100).toFixed(2)} ${s.currency.toUpperCase()}\nHighlights:\n${s.highlights.map((h) => `- ${h}`).join("\n")}`,
      metadata: { category: "service", slug: s.slug },
    });
  }

  for (const faq of faqs) {
    docs.push({
      title: `FAQ: ${faq.q}`,
      content: `Q: ${faq.q}\nA: ${faq.a}`,
      metadata: { category: "faq" },
    });
  }

  for (const s of pharmacyServices) {
    docs.push({
      title: `Pharmacy: ${s.title}`,
      content: s.body,
      metadata: { category: "pharmacy" },
    });
  }

  for (const tip of medicationSafety) {
    docs.push({
      title: `Medication safety: ${tip.title}`,
      content: tip.body,
      metadata: { category: "medication-safety" },
    });
  }

  for (const cat of medicationCategories) {
    docs.push({
      title: `Medication category: ${cat.category}`,
      content: `${cat.body}\nExamples: ${cat.examples}`,
      metadata: { category: "medication" },
    });
  }

  docs.push({
    title: "Insurance and pricing policy",
    content: [insuranceInfo.intro, ...insuranceInfo.points.map((p) => `${p.title}: ${p.body}`)].join("\n\n"),
    metadata: { category: "pricing" },
  });

  return docs;
}

async function embedDoc(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: { google: { outputDimensionality: 768 } },
  });
  return embedding;
}

async function main() {
  const docs = buildDocs();
  console.log(`Seeding ${docs.length} documents…`);

  await supabase.from("chat_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const doc of docs) {
    const embedding = await embedDoc(`${doc.title}\n${doc.content}`);
    const { error } = await supabase.from("chat_documents").insert({
      title: doc.title,
      content: doc.content,
      embedding,
      metadata: doc.metadata ?? {},
    });
    if (error) {
      console.error(`  ✗ ${doc.title}:`, error.message);
    } else {
      console.log(`  ✓ ${doc.title}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
