"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "./cart-context";

export function AddToCart({ item }: { item: Omit<CartItem, "quantity"> }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant={added ? "secondary" : "primary"}
      onClick={() => {
        addItem(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? "Added ✓" : "Add to cart"}
    </Button>
  );
}
