"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-teal"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M7 4h-2a1 1 0 000 2h1.2l1.6 9.6A2 2 0 009.77 17H17a2 2 0 001.96-1.6l1.2-6A1 1 0 0019.18 8H8.2l-.3-1.84A2 2 0 005.93 4.5 2 2 0 005 4.34V4zm2 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-navy">
          {count}
        </span>
      )}
    </Link>
  );
}
