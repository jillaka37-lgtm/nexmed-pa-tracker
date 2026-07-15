import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { defaultServices } from "@/lib/content";

export const showPricesSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe("Optional keyword to filter services by name"),
});

export async function showPrices(
  params: z.infer<typeof showPricesSchema>,
): Promise<string> {
  const admin = createAdminClient();

  let services: { title: string; description: string; price_cents: number; currency: string; duration_min: number; slug: string }[] = [];

  const { data } = await admin
    .from("services")
    .select("title, description, price_cents, currency, duration_min, slug")
    .eq("active", true)
    .order("sort_order");

  services = data?.length ? data : defaultServices;

  if (params.filter) {
    const keyword = params.filter.toLowerCase();
    services = services.filter(
      (s) =>
        s.title.toLowerCase().includes(keyword) ||
        s.description.toLowerCase().includes(keyword),
    );
  }

  if (!services.length) {
    return "I couldn't find any matching services. You can view all our services at [/services](/services).";
  }

  const lines = services.map(
    (s) =>
      `**${s.title}** — ${formatPrice(s.price_cents, s.currency)} (${s.duration_min} min)\n${s.description}`,
  );

  return `Here are our current services:\n\n${lines.join("\n\n")}\n\nReady to book? Just let me know and I'll set up a checkout link for you!`;
}
