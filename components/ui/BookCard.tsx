import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import TiltCard from "@/components/ui/TiltCard";
import AddToCart from "@/components/ui/AddToCart";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";

interface BookCardProps {
  book: Book;
}

function StarsMini({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const label = `${rating.toFixed(1)} out of 5 — ${count} reviews`;

  return (
    <div role="img" aria-label={label} className="flex items-center gap-1">
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 12 12"
            className="h-2.5 w-2.5"
            fill={i < full ? "#d8a84b" : i === full && half ? "url(#half)" : "none"}
            stroke="#d8a84b"
            strokeWidth="1"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#d8a84b" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <polygon points="6,1 7.6,4.2 11,4.7 8.5,7.1 9.1,10.5 6,8.8 2.9,10.5 3.5,7.1 1,4.7 4.4,4.2" />
          </svg>
        ))}
      </span>
      <span className="font-mono text-[10px] text-stone">{count}</span>
    </div>
  );
}

export default function BookCard({ book }: BookCardProps) {
  const isLowStock =
    book.stockStatus === "low_stock" ||
    (typeof book.stockQuantity === "number" && book.stockQuantity > 0 && book.stockQuantity <= 3);
  const firstGenre = book.genre?.[0]?.name;
  const hasRating =
    typeof (book as { averageRating?: number }).averageRating === "number" &&
    typeof (book as { reviewCount?: number }).reviewCount === "number" &&
    ((book as { reviewCount?: number }).reviewCount ?? 0) > 0;

  return (
    <TiltCard>
      <article className="fx-card group relative flex flex-col h-full rounded-2xl border border-smoke bg-obsidian/80 p-3 transition hover:border-gold/60 sm:p-4">
        <Link
          href={`/books/${book.slug}`}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`Open ${book.title}`}
        />

        <div className="book-edge relative aspect-[3/4] overflow-hidden rounded-xl shrink-0">
          <div className="absolute inset-0 z-[1]">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={`Cover of ${book.title} by ${book.author?.name ?? "Unknown Author"}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEzMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIxZDE3Ii8+PC9zdmc+"
              />
            ) : (
              <DecorativeBookCover
                title={book.title}
                subtitle={book.author?.name}
                tag={book.featured ? "FEATURED EDITION" : "KOTHAKHAHON"}
                compact
                className="rounded-none border-0"
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-void/90 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 z-[3] flex flex-col gap-1.5 sm:left-3 sm:top-3">
            {book.featured && (
              <span className="rounded-full border border-gold/40 bg-void/80 px-2 py-0.5 font-ui text-[9px] tracking-[0.14em] text-gold sm:px-2.5 sm:text-[10px]">
                FEATURED
              </span>
            )}
            {isLowStock && (
              <span className="animate-pulse rounded-full border border-ember/50 bg-ember/20 px-2 py-0.5 font-ui text-[9px] tracking-[0.12em] text-ember sm:px-2.5 sm:text-[10px]">
                LOW STOCK
              </span>
            )}
          </div>

          <div className="absolute right-2.5 top-2.5 z-[3] rounded-full border border-gold/40 bg-void/80 px-2 py-1 font-ui text-[9px] tracking-[0.14em] text-gold sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px]">
            BOOK
          </div>
        </div>

        <div className="relative z-20 mt-3 flex flex-1 flex-col justify-between sm:mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="line-clamp-2 text-safe font-title text-[1.2rem] leading-tight text-ivory sm:text-[1.38rem] xl:text-[1.5rem]">
              {book.title}
            </h3>
            <p className="line-clamp-1 font-body text-[13px] text-stone sm:text-sm">
              {book.author?.name ?? "Unknown Author"}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* Genre tag */}
              {firstGenre && (
                <span className="inline-block rounded-full border border-gold/20 bg-gold/8 px-2 py-0.5 font-ui text-[9px] tracking-[0.11em] text-gold/70">
                  {firstGenre.toUpperCase()}
                </span>
              )}

              {/* Rating stars */}
              {hasRating && (
                <StarsMini
                  rating={(book as { averageRating?: number }).averageRating ?? 0}
                  count={(book as { reviewCount?: number }).reviewCount ?? 0}
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-1">
            <div className="ink-divider mb-3" />
            <div className="flex items-center justify-between gap-2">
              <p
                aria-label={`Price ${formatINR(book.price)}`}
                className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[11px] text-parchment sm:text-xs"
              >
                {formatINR(book.price)}
              </p>
              <AddToCart
                bookId={book._id}
                title={book.title}
                price={book.price}
                authorName={book.author?.name}
                coverImageUrl={book.coverImageUrl}
                label="ADD TO CART"
                addedLabel="ADDED TO CART"
                mobileLabel="ADD"
                mobileAddedLabel="ADDED"
                className="min-w-0 px-3 py-2 text-[9px] tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.14em]"
              />
            </div>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
