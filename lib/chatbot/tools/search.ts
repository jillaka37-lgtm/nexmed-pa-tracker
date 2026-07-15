import { z } from "zod";
import { retrieveContext } from "@/lib/chatbot/rag";

export const searchContentSchema = z.object({
  query: z.string().describe("The search query to look up in the knowledge base"),
});

export async function searchContent(
  params: z.infer<typeof searchContentSchema>,
): Promise<string> {
  const { context } = await retrieveContext(params.query, 5);
  if (!context) {
    return "I couldn't find specific information about that. You can contact our team at hello@nexmed.com for more details.";
  }
  return context;
}
