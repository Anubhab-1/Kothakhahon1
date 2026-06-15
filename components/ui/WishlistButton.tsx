"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/app/account/wishlist/actions";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string | null;
  price?: number | null;
  isSaved: boolean;
  className?: string;
}

export default function WishlistButton({
  bookId,
  bookSlug,
  bookTitle,
  bookAuthor,
  bookCoverUrl,
  price,
  isSaved,
  className,
}: WishlistButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await toggleWishlistAction(formData);
        });
      }}
    >
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="bookSlug" value={bookSlug} />
      <input type="hidden" name="bookTitle" value={bookTitle} />
      <input type="hidden" name="bookAuthor" value={bookAuthor} />
      {bookCoverUrl && <input type="hidden" name="bookCoverUrl" value={bookCoverUrl} />}
      {price != null && <input type="hidden" name="price" value={String(price)} />}

      <button
        type="submit"
        disabled={isPending}
        aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
        title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "fx-button inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-ui text-xs tracking-[0.14em] transition-all duration-300",
          isSaved
            ? "border-ember/60 bg-ember/10 text-ember hover:bg-ember/20"
            : "border-smoke bg-obsidian text-stone hover:border-gold hover:text-gold",
          isPending && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        <Heart
          className={cn("h-4 w-4 transition-all", isSaved && "fill-current")}
        />
        {isSaved ? "SAVED" : "SAVE"}
      </button>
    </form>
  );
}
