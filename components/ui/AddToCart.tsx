"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { cn } from "@/lib/utils";

interface AddToCartProps {
  bookId: string;
  title: string;
  price?: number;
  authorName?: string;
  coverImageUrl?: string;
  label?: string;
  addedLabel?: string;
  mobileLabel?: string;
  mobileAddedLabel?: string;
  className?: string;
}

export default function AddToCart({
  bookId,
  title,
  price,
  authorName,
  coverImageUrl,
  label = "ADD TO BAG",
  addedLabel = "ADDED TO BAG",
  mobileLabel,
  mobileAddedLabel,
  className,
}: AddToCartProps) {
  const { addItem, openDrawer } = useCart();
  const [added, setAdded] = useState(false);
  const compactLabel = mobileLabel ?? label;
  const compactAddedLabel = mobileAddedLabel ?? addedLabel;

  return (
    <button
      type="button"
      onClick={() => {
        addItem(
          {
            bookId,
            title,
            price,
            authorName,
            coverImageUrl,
          },
          1,
        );
        setAdded(true);
        openDrawer();
        setTimeout(() => setAdded(false), 1000);
      }}
      className={cn(
        "fx-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-6 py-3 font-ui text-xs tracking-[0.14em] transition-all duration-300",
        added
          ? "border-ivory bg-ivory text-void shadow-[0_10px_24px_rgba(250,246,239,0.26)]"
          : "border-gold bg-gold text-void shadow-[0_10px_24px_rgba(201,151,58,0.26)] hover:border-gold-dim hover:bg-gold-dim",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="sm:hidden">{added ? compactAddedLabel : compactLabel}</span>
      <span className="hidden sm:inline">{added ? addedLabel : label}</span>
    </button>
  );
}
