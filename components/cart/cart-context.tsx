"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  requires_rx: boolean;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  currency: string;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nexmed-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage may be unavailable (private mode) — cart still works in-memory
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce(
      (n, i) => n + i.price_cents * i.quantity,
      0,
    );
    return {
      items,
      count,
      subtotalCents,
      currency: items[0]?.currency ?? "usd",
      addItem: (item, quantity = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.slug === item.slug);
          if (existing) {
            return prev.map((p) =>
              p.slug === item.slug
                ? { ...p, quantity: p.quantity + quantity }
                : p,
            );
          }
          return [...prev, { ...item, quantity }];
        }),
      setQuantity: (slug, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((p) => p.slug !== slug)
            : prev.map((p) => (p.slug === slug ? { ...p, quantity } : p)),
        ),
      removeItem: (slug) =>
        setItems((prev) => prev.filter((p) => p.slug !== slug)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
