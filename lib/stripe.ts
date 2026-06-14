import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

export const stripe = secret ? new Stripe(secret) : null;

export const hasStripeEnv = Boolean(secret);

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
