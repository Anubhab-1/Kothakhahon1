"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogBook } from "@/lib/types";
import { getStockStatusLabel, isBookAvailableForSale } from "@/lib/inventory";
import { formatINR, cn } from "@/lib/utils";
import TiltCard from "@/components/ui/TiltCard";
import AddToCart from "@/components/ui/AddToCart";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";

interface CatalogBookCardProps {
  book: CatalogBook;
}

export default function CatalogBookCard({ book }: CatalogBookCardProps) {
  const isAvailable = isBookAvailableForSale(book);

  return (
    <TiltCard>
      <article
        className="fx-card group relative flex flex-col h-full rounded-2xl border border-smoke bg-obsidian/85 p-3 transition hover:border-gold/60 hover:shadow-[0_16px_45px_rgba(201,151,58,0.22)] sm:p-4"
      >
        <Link
          href={`/books/${book.slug}`}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`Open ${book.title}`}
        />

        <div className="book-edge relative aspect-[3/4] overflow-hidden rounded-xl shrink-0">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={`Cover of ${book.title} by ${book.authorName ?? "Unknown Author"}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <DecorativeBookCover
              title={book.title}
              subtitle={book.authorName}
              compact
              className="rounded-none border-0"
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent" />

          <div className="absolute left-2.5 top-2.5 rounded-full border border-gold/40 bg-void/80 px-2 py-1 font-ui text-[9px] tracking-[0.14em] text-gold sm:left-3 sm:top-3 sm:px-2.5 sm:text-[10px]">
            BOOK
          </div>
          {book.stockStatus !== "in_stock" && (
            <div className={cn(
              "absolute right-2.5 top-2.5 rounded-full border bg-void/80 px-2 py-1 font-ui text-[9px] tracking-[0.14em] sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px]",
              book.stockStatus === "out_of_stock" 
                ? "border-ember/50 text-ember" 
                : "border-gold/50 text-gold animate-pulse"
            )}>
              {getStockStatusLabel(book.stockStatus).toUpperCase()}
            </div>
          )}
        </div>

        <div className="relative z-20 mt-3 flex flex-1 flex-col justify-between sm:mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="line-clamp-2 text-safe font-title text-[1.2rem] leading-tight text-ivory sm:text-[1.38rem] xl:text-[1.5rem]">
              {book.title}
            </h3>
            <p className="line-clamp-1 font-body text-[13px] text-stone sm:text-sm">{book.authorName}</p>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {book.genreNames.slice(0, 2).map((genre, idx) => (
                <span key={`${book.id}-${genre}`}>
                  {idx > 0 && <span className="sr-only">, </span>}
                  <span className="rounded-full border border-gold/25 bg-gold/5 px-2.5 py-0.5 font-mono text-[9px] text-stone">
                    {genre}
                  </span>
                </span>
              ))}
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
                bookId={book.id}
                title={book.title}
                price={book.price}
                authorName={book.authorName}
                coverImageUrl={book.coverImageUrl}
                disabled={!isAvailable}
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
