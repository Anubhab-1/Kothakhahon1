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

export default function BookCard({ book }: BookCardProps) {
  return (
    <TiltCard>
      <article className="fx-card group relative rounded-2xl border border-smoke bg-obsidian/80 p-3 transition hover:border-gold/60 sm:p-4">
        <Link
          href={`/books/${book.slug}`}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`Open ${book.title}`}
        />

        <div className="book-edge relative aspect-[3/4] overflow-hidden rounded-xl">
          <div className="absolute inset-0 z-[1]">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
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

          {book.featured ? (
            <div className="absolute left-2.5 top-2.5 z-[3] rounded-full border border-gold/40 bg-void/80 px-2 py-1 font-ui text-[9px] tracking-[0.14em] text-gold sm:left-3 sm:top-3 sm:px-2.5 sm:text-[10px]">
              FEATURED
            </div>
          ) : null}
        </div>

        <div className="relative z-20 mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
          <h3 className="line-clamp-2 text-safe font-title text-[1.28rem] leading-tight text-ivory sm:text-[1.55rem] xl:text-[1.8rem]">
            {book.title}
          </h3>
          <p className="line-clamp-1 font-body text-[13px] text-stone sm:text-sm">
            {book.author?.name ?? "Unknown Author"}
          </p>

          <div className="ink-divider mt-2" />

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="rounded-full border border-smoke px-2 py-1 font-mono text-[11px] text-parchment sm:px-2.5 sm:text-xs">
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
      </article>
    </TiltCard>
  );
}
