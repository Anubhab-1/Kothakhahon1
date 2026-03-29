"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  count?: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
} as const;

export default function StarRating({
  rating,
  interactive = false,
  onRatingChange,
  count,
  reviewCount,
  size = "md",
  showCount = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const boundedRating = Math.max(0, Math.min(5, rating));
  const activeRating = interactive ? hoverRating || boundedRating : boundedRating;
  const fillThreshold = Math.round(activeRating);
  const totalReviews = typeof reviewCount === "number" ? reviewCount : count;

  return (
    <div
      className="flex items-center gap-2"
      onMouseLeave={
        interactive
          ? () => {
              setHoverRating(0);
            }
          : undefined
      }
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= fillThreshold;
          const baseClass = cn(
            sizeMap[size],
            "leading-none transition-colors duration-150",
            isFilled ? "text-gold" : "text-smoke",
            interactive && "cursor-pointer",
          );

          if (!interactive) {
            return (
              <span key={`star-${starValue}`} aria-hidden className={baseClass}>
                {"\u2605"}
              </span>
            );
          }

          return (
            <button
              key={`star-${starValue}`}
              type="button"
              className={baseClass}
              onMouseEnter={() => setHoverRating(starValue)}
              onFocus={() => setHoverRating(starValue)}
              onBlur={() => setHoverRating(0)}
              onClick={() => {
                onRatingChange?.(starValue);
              }}
              aria-label={`Rate ${starValue} out of 5`}
              aria-pressed={Math.round(boundedRating) === starValue}
            >
              {"\u2605"}
            </button>
          );
        })}
      </div>

      <span className="font-mono text-xs text-gold">{boundedRating.toFixed(1)}</span>
      {showCount && typeof totalReviews === "number" ? (
        <span className="font-mono text-xs text-stone">({totalReviews} reviews)</span>
      ) : null}
    </div>
  );
}
