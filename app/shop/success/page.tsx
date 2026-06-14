import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { stripe } from "@/lib/stripe";
import { confirmOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let order = null;

  if (session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const orderId = session.metadata?.order_id;
      if (orderId && session.payment_status === "paid") {
        const paymentIntent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;
        order = await confirmOrder(
          orderId,
          paymentIntent,
          session.customer_details?.email,
        );
      }
    } catch {
      // fall through to generic confirmation
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <ClearCartOnMount />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-health/15">
        <svg viewBox="0 0 24 24" className="h-9 w-9 fill-health" aria-hidden>
          <path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l9-9a1 1 0 10-1.4-1.4L9 16.2z" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-muted">
        Your payment was successful. A confirmation email with your order
        details is on its way.
      </p>

      {order && order.items.length > 0 && (
        <div className="mt-8 rounded-2xl border border-divider bg-surface p-6 text-left">
          <ul className="space-y-3 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-offwhite">
                  {i.name}{" "}
                  <span className="text-muted">× {i.quantity}</span>
                </span>
                <span className="font-mono text-offwhite">
                  {formatPrice(i.unit_amount_cents * i.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-divider pt-4">
            <span className="text-muted">Total paid</span>
            <span className="font-mono text-gold">
              {formatPrice(order.amount_cents, order.currency)}
            </span>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        We&rsquo;ll follow up with pickup or delivery details shortly.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/shop" size="lg">
          Continue shopping
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">
          Back home
        </ButtonLink>
      </div>
      <p className="mt-6 text-xs text-muted">
        Need help?{" "}
        <Link href="/contact" className="text-teal hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
