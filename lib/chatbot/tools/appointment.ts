import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const bookAppointmentSchema = z.object({
  service_slug: z
    .string()
    .optional()
    .default("initial-consultation")
    .describe("The service slug, e.g. 'initial-consultation'"),
  preferred_date: z
    .string()
    .optional()
    .describe("Preferred date in YYYY-MM-DD format (optional, for context)"),
  name: z.string().optional().describe("Patient full name"),
  email: z.string().email().optional().describe("Patient email address for confirmation"),
});

export async function bookAppointment(
  params: z.infer<typeof bookAppointmentSchema>,
): Promise<string> {
  const admin = createAdminClient();

  const { data: service } = await admin
    .from("services")
    .select("id, title, price_cents, currency, duration_min")
    .eq("slug", params.service_slug ?? "initial-consultation")
    .eq("active", true)
    .maybeSingle();

  if (!service) {
    return "I couldn't find that service. You can browse and book directly at [our booking page](/book).";
  }

  if (!stripe) {
    return `You can book a **${service.title}** directly at [our booking page](/book). If you have any questions first, feel free to ask!`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: service.currency,
            product_data: {
              name: service.title,
              description: `${service.duration_min}-minute private consultation`,
            },
            unit_amount: service.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: params.email,
      success_url: `${siteUrl}/booking/success`,
      cancel_url: `${siteUrl}/book`,
    });

    return `Great! I've created a secure checkout link for your **${service.title}** (${service.duration_min} min). Click below to complete your booking:\n\n[Book Now — ${new Intl.NumberFormat("en-US", { style: "currency", currency: service.currency }).format(service.price_cents / 100)}](${session.url})\n\nYou'll receive a confirmation email with your meeting link once payment is complete.`;
  } catch (err) {
    console.error("[bookAppointment] Stripe error:", err);
    return `You can book a **${service.title}** directly at [our booking page](/book).`;
  }
}
