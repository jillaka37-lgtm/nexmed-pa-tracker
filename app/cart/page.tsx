"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { startShopCheckout } from "@/app/shop/actions";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotalCents, currency, setQuantity, removeItem } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function checkout() {
    setError(null);
    startTransition(async () => {
      const res = await startShopCheckout(
        items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      );
      if (res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error ?? "Could not start checkout. Please try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-divider bg-surface p-10 text-center">
          <p className="text-muted">Your cart is empty.</p>
          <ButtonLink href="/shop" size="lg" className="mt-6">
            Browse the shop
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-8 divide-y divide-divider rounded-2xl border border-divider bg-surface">
            {items.map((i) => (
              <div
                key={i.slug}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-offwhite">{i.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(i.price_cents, i.currency)} each
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg border border-divider">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(i.slug, i.quantity - 1)}
                      className="h-9 w-9 text-muted transition-colors hover:text-teal"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm text-offwhite">
                      {i.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(i.slug, i.quantity + 1)}
                      className="h-9 w-9 text-muted transition-colors hover:text-teal"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-mono text-gold">
                    {formatPrice(i.price_cents * i.quantity, i.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i.slug)}
                    className="text-xs text-muted transition-colors hover:text-gold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-divider pt-6">
            <span className="text-muted">Subtotal</span>
            <span className="font-mono text-xl text-gold">
              {formatPrice(subtotalCents, currency)}
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-muted">
            Shipping &amp; taxes calculated at checkout.
          </p>

          {error && <p className="mt-4 text-sm text-gold">{error}</p>}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/shop"
              className="text-sm text-muted transition-colors hover:text-teal"
            >
              Continue shopping
            </Link>
            <Button size="lg" onClick={checkout} disabled={pending}>
              {pending ? "Starting checkout…" : "Checkout securely"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
