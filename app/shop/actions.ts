"use server";

import { getUser } from "@/lib/auth";
import { getActiveProducts } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { stripe, hasStripeEnv, getSiteUrl } from "@/lib/stripe";

export type ShopCheckoutResult = {
  url?: string;
  error?: string;
};

export async function startShopCheckout(
  items: { slug: string; quantity: number }[],
): Promise<ShopCheckoutResult> {
  if (!items.length) return { error: "Your cart is empty." };

  if (!hasSupabaseEnv || !hasStripeEnv || !stripe) {
    return {
      error:
        "The shop isn't fully configured yet. Add your Supabase and Stripe keys to .env.local.",
    };
  }

  // Re-price everything from the server catalog — never trust client prices.
  const catalog = await getActiveProducts();
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));

  const priced = items
    .map((i) => ({
      product: bySlug.get(i.slug),
      quantity: Math.max(1, Math.floor(i.quantity)),
    }))
    .filter(
      (line): line is { product: NonNullable<typeof line.product>; quantity: number } =>
        Boolean(line.product) && !line.product!.requires_rx,
    );

  if (!priced.length) {
    return {
      error:
        "None of your items can be purchased online. Prescription items must be requested via refill.",
    };
  }

  const currency = priced[0].product.currency;
  const amountCents = priced.reduce(
    (sum, l) => sum + l.product.price_cents * l.quantity,
    0,
  );

  const user = await getUser();
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      status: "pending_payment",
      amount_cents: amountCents,
      currency,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Could not start checkout. Please try again." };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    priced.map((l) => ({
      order_id: order.id,
      product_id: l.product.id.startsWith("default-") ? null : l.product.id,
      name: l.product.name,
      unit_amount_cents: l.product.price_cents,
      quantity: l.quantity,
    })),
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Could not start checkout. Please try again." };
  }

  const site = getSiteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user?.email ?? undefined,
      line_items: priced.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: l.product.currency,
          unit_amount: l.product.price_cents,
          product_data: {
            name: l.product.name,
            description: l.product.description,
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
      metadata: { order_id: order.id },
      success_url: `${site}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cart`,
    });

    await admin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    if (!session.url) return { error: "Could not start checkout." };
    return { url: session.url };
  } catch {
    await admin.from("order_items").delete().eq("order_id", order.id);
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Could not start checkout. Please try again." };
  }
}
