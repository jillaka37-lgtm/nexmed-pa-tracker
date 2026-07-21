import { z } from "zod";
import { runAgentJSON } from "@/lib/ai-agents/core";
import { COMPANY_PROFILE } from "../company";
import { lessonsBlockFor } from "../lessons";
import { researchSchema, RESEARCH_SHAPE_HINT, type Brief, type Research } from "../types";

/**
 * Gathers the raw material for the article — facts, examples, common
 * questions — so the writer doesn't have to invent them (reduces
 * hallucination). "Model decides, code executes" pattern: if a Tavily key
 * is configured, the model designs search queries (a judgment call) but a
 * plain fetch does the actual searching (deterministic execution) — more
 * trustworthy than handing the model an open-ended tool. Without a key, the
 * researcher falls back to the model's own knowledge and the pipeline
 * doesn't break.
 */

const queriesSchema = z.object({ queries: z.array(z.string()).min(2).max(4) });

type SearchResult = { title: string; url: string; content: string };

async function tavilySearch(query: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: 3, search_depth: "basic" }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.results ?? []) as { title?: string; url?: string; content?: string }[]).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: String(r.content ?? "").slice(0, 800),
  }));
}

export async function research(opts: { brief: Brief }): Promise<Research> {
  const lessons = await lessonsBlockFor("researcher");
  const { brief } = opts;

  const system = `You are the researcher for the NexMed content team. You prepare accurate, citable raw material for the writer. You don't exaggerate and you don't invent unsourced statistics.\n\n${COMPANY_PROFILE}${lessons}`;

  let webContext = "";
  if (process.env.TAVILY_API_KEY) {
    const { data: queryData } = await runAgentJSON({
      system,
      prompt: `Design 2-4 web search queries for an article with these specs:
Title: ${brief.title}
Primary keyword: ${brief.primaryKeyword}
Audience: ${brief.audience}`,
      schema: queriesSchema,
      shapeHint: `{"queries":["...","..."]}`,
      temperature: 0.4,
      maxOutputTokens: 300,
    });

    const allResults = (await Promise.all(queryData.queries.map(tavilySearch))).flat();
    if (allResults.length > 0) {
      webContext = `\n\nWeb search results (raw material only, verify before use):\n${allResults.map((r) => `- ${r.title} (${r.url})\n  ${r.content}`).join("\n")}`;
    }
  }

  const prompt = `Article brief:
Title: ${brief.title}
Audience: ${brief.audience}
Search intent: ${brief.searchIntent}
Outline: ${brief.outline.map((s) => s.heading).join(" / ")}${webContext}

Prepare the article's raw research material:
- keyFacts: key points/facts the article should cover (if you're not sure of an exact statistic, state the trend or principle instead of a precise number).
- examples: concrete, realistic examples relevant to a pharmacy/health audience.
- commonQuestions: questions readers actually have about this topic (for an FAQ section).
- angleNotes: your advice to the writer for making the article distinctive.`;

  const { data } = await runAgentJSON({
    system,
    prompt,
    schema: researchSchema,
    shapeHint: RESEARCH_SHAPE_HINT,
    temperature: 0.4,
    maxOutputTokens: 1200,
  });
  return data;
}
