import { embed } from "ai";
import { google } from "@ai-sdk/google";
import { createAdminClient } from "@/lib/supabase/admin";

const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: { google: { outputDimensionality: 768 } },
  });
  return embedding;
}

export async function retrieveContext(query: string, topK = 4): Promise<{ context: string; ragHit: boolean }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return { context: "", ragHit: false };

  try {
    const queryEmbedding = await embedText(query);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("match_chat_documents", {
      query_embedding: queryEmbedding,
      match_count: topK,
      match_threshold: 0.4,
    });

    if (error || !data?.length) return { context: "", ragHit: false };

    const context = (data as { title: string; content: string }[])
      .map((doc) => `### ${doc.title}\n${doc.content}`)
      .join("\n\n");

    return { context, ragHit: true };
  } catch {
    return { context: "", ragHit: false };
  }
}
