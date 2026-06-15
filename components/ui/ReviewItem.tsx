import { Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewItemProps {
  reviewerName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  purchaseVerified: boolean;
  createdAt: Date;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3.5 w-3.5",
            s <= rating ? "fill-gold text-gold" : "fill-none text-stone/30"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewItem({
  reviewerName,
  rating,
  title,
  body,
  purchaseVerified,
  createdAt,
}: ReviewItemProps) {
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(createdAt));

  const initials = reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="rounded-2xl border border-smoke bg-obsidian p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-smoke bg-void font-ui text-xs text-parchment">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-ui text-[12px] tracking-[0.1em] text-parchment">{reviewerName}</p>
              {purchaseVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-ui text-[9px] tracking-[0.12em] text-emerald-400">
                  <BadgeCheck className="h-3 w-3" />
                  VERIFIED PURCHASE
                </span>
              )}
            </div>
            <p className="mt-0.5 font-ui text-[10px] tracking-[0.1em] text-stone/60">{dateStr}</p>
          </div>
        </div>
        <StarRow rating={rating} />
      </div>

      {title && (
        <p className="font-title text-xl text-ivory">{title}</p>
      )}
      {body && (
        <p className="font-body text-base leading-relaxed text-parchment/85">{body}</p>
      )}
    </article>
  );
}
