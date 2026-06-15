"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/reviews/actions";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  bookId: string;
  bookSlug: string;
  isLoggedIn: boolean;
}

export default function ReviewForm({ bookId, bookSlug, isLoggedIn }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-smoke bg-obsidian/50 p-6 text-center">
        <p className="font-body text-base text-stone">
          <a href={`/login?next=/books/${bookSlug}`} className="fx-link text-gold hover:text-gold-dim">
            Sign in
          </a>{" "}
          to leave a review for this book.
        </p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        if (rating === 0) return;
        startTransition(() => submitReviewAction(fd));
      }}
      className="rounded-2xl border border-smoke bg-obsidian p-6 space-y-5"
    >
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="bookSlug" value={bookSlug} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <p className="font-ui text-[11px] tracking-[0.16em] text-gold mb-3">YOUR RATING</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hovered || rating) >= star
                    ? "fill-gold text-gold"
                    : "fill-none text-stone/40"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center font-ui text-[11px] tracking-[0.14em] text-parchment/60">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="font-ui text-[11px] tracking-[0.16em] text-parchment/70">
          HEADLINE <span className="text-stone/50">(optional)</span>
        </span>
        <input
          type="text"
          name="title"
          maxLength={100}
          placeholder="Summarise your experience in one line"
          className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1 placeholder:text-stone/40"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-ui text-[11px] tracking-[0.16em] text-parchment/70">
          REVIEW <span className="text-stone/50">(optional)</span>
        </span>
        <textarea
          name="body"
          rows={4}
          maxLength={1000}
          placeholder="Share your thoughts on the writing, story, or characters…"
          className="w-full resize-none rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1 placeholder:text-stone/40"
        />
      </label>

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className={cn(
          "fx-button w-full rounded-full border py-3 font-ui text-xs tracking-[0.14em] transition-all",
          rating === 0
            ? "cursor-not-allowed border-smoke bg-obsidian text-stone/40"
            : isPending
              ? "border-gold/50 bg-gold/50 text-void/70 cursor-not-allowed"
              : "border-gold bg-gold text-void hover:bg-gold-dim shadow-[0_8px_20px_rgba(216,168,75,0.2)]"
        )}
      >
        {isPending ? "SUBMITTING…" : "SUBMIT REVIEW"}
      </button>

      <p className="font-body text-xs text-stone/50 text-center">
        Reviews are approved before appearing publicly.
      </p>
    </form>
  );
}
