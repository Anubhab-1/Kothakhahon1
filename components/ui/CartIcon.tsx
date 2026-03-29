"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className }: CartIconProps) {
  const { itemCount, toggleDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      className={`fx-button !overflow-visible [&::before]:hidden relative rounded-full border border-smoke p-2 text-parchment transition hover:border-gold hover:text-gold hover:shadow-none ${className ?? ""}`}
      aria-label="Open cart"
      suppressHydrationWarning
    >
      <ShoppingCart className="h-4 w-4" />
      <span
        suppressHydrationWarning
        className="absolute -top-2 -right-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 font-mono text-[10px] leading-none text-void"
      >
        {itemCount}
      </span>
    </button>
  );
}
