/** OpenRouter per-1K-token prices, USD, input/output. Approximate — updated
 * by hand, not fetched live, since the judge model list here is small and
 * stable. Used only for the cost dashboard, not billing. */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash": { input: 0.0003, output: 0.0025 },
  "google/gemini-2.5-flash-lite": { input: 0.0001, output: 0.0004 },
  "anthropic/claude-haiku-4.5": { input: 0.001, output: 0.005 },
  "anthropic/claude-sonnet-4.5": { input: 0.003, output: 0.015 },
};

const DEFAULT_PRICING = { input: 0.0005, output: 0.002 };

export function estimateCostForModel(model: string, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
}
