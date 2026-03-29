"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Barcode,
  BookOpenText,
  CalendarDays,
  Languages,
  Mail,
  PackageCheck,
  ScrollText,
  WalletCards,
} from "lucide-react";
import TiltedBookCover from "@/components/books/TiltedBookCover";
import { motion } from "@/components/ui/StaticMotion";
import AddToCart from "@/components/ui/AddToCart";
import ChapterPreview from "@/components/ui/ChapterPreview";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";
import StarRating from "@/components/ui/StarRating";
import { formatDisplayDate } from "@/lib/date";
import type { BookDetailView, RelatedBook } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface BookDetailClientProps {
  book: BookDetailView;
  relatedBooks: RelatedBook[];
}

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function BookDetailClient({ book, relatedBooks }: BookDetailClientProps) {
  const trustPromises = [
    {
      title: "Cash On Delivery",
      description: "Available on eligible India orders.",
      icon: WalletCards,
    },
    {
      title: "Guest Checkout",
      description: "Order directly without creating an account first.",
      icon: PackageCheck,
    },
    {
      title: "Packed In Kolkata",
      description: "The publishing desk handles catalog and dispatch together.",
      icon: ScrollText,
    },
  ];

  return (
    <div className="pb-28 md:pb-12">
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
        <motion.div variants={reveal} initial="hidden" animate="show" transition={{ duration: 0.45 }}>
          <div className="editorial-panel rounded-2xl p-5 md:p-6">
            <TiltedBookCover
              title={book.title}
              authorName={book.authorName}
              coverImageUrl={book.coverImageUrl}
            />
          </div>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, delay: 0.08 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap gap-2">
            {book.genres.map((genre) => (
              <span
                key={`${book.id}-${genre}`}
                className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 font-ui text-[10px] tracking-[0.12em] text-gold"
              >
                {genre.toUpperCase()}
              </span>
            ))}
          </div>

          <div>
            <h1 className="text-safe font-title text-5xl text-ivory md:text-6xl">{book.title}</h1>
            {book.titleEn ? <p className="mt-2 font-body text-xl text-stone">{book.titleEn}</p> : null}
            <p className="mt-3 font-body text-lg text-parchment">
              by{" "}
              {book.authorSlug ? (
                <Link href={`/authors/${book.authorSlug}`} className="fx-link text-gold hover:text-gold-dim">
                  {book.authorName}
                </Link>
              ) : (
                book.authorName
              )}
            </p>
          </div>

          {book.reviewCount > 0 ? (
            <StarRating rating={book.averageRating} count={book.reviewCount} size="lg" />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-gold">
                NEW ON THE SHELF
              </span>
              <p className="font-body text-sm text-stone">
                Reader ratings will appear here after the first verified orders.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="fx-card rounded-lg border border-smoke bg-obsidian p-4">
              <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PUBLICATION DATE</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <CalendarDays className="h-4 w-4 text-gold" />
                {formatDisplayDate(book.publicationDate, "Unknown")}
              </p>
            </div>
            <div className="fx-card rounded-lg border border-smoke bg-obsidian p-4">
              <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PAGE COUNT</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <BookOpenText className="h-4 w-4 text-gold" />
                {book.pageCount ?? "Unknown"}
              </p>
            </div>
            <div className="fx-card rounded-lg border border-smoke bg-obsidian p-4">
              <p className="font-ui text-[10px] tracking-[0.13em] text-stone">ISBN</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-xs text-parchment">
                <Barcode className="h-4 w-4 text-gold" />
                {book.isbn ?? "Not listed"}
              </p>
            </div>
            <div className="fx-card rounded-lg border border-smoke bg-obsidian p-4">
              <p className="font-ui text-[10px] tracking-[0.13em] text-stone">LANGUAGE</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <Languages className="h-4 w-4 text-gold" />
                {book.language ?? "Bengali"}
              </p>
            </div>
          </div>

          <div className="editorial-panel rounded-xl p-6">
            <p className="font-ui text-xs tracking-[0.15em] text-stone">PRICE</p>
            <p className="mt-1 font-title text-4xl text-ivory">{formatINR(book.price)}</p>
            <p className="mt-3 max-w-2xl font-body text-base text-stone">
              Order direct from the press with guest checkout and Cash on Delivery on eligible India
              orders.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AddToCart
                bookId={book.id}
                title={book.title}
                price={book.price}
                authorName={book.authorName}
                coverImageUrl={book.coverImageUrl}
              />
              {book.buyLink ? (
                <Link
                  href={book.buyLink}
                  className="fx-button inline-flex items-center justify-center rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.13em] text-parchment transition hover:border-gold hover:text-gold"
                >
                  BUY FROM PARTNER STORE
                </Link>
              ) : null}
              <Link
                href="/contact"
                className="fx-button inline-flex items-center justify-center rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.13em] text-parchment transition hover:border-gold hover:text-gold"
              >
                ASK ABOUT BULK OR GIFT ORDERS
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {trustPromises.map((promise) => {
                const Icon = promise.icon;
                return (
                  <div key={promise.title} className="rounded-2xl border border-smoke bg-black/10 p-4">
                    <Icon className="h-4 w-4 text-gold" />
                    <p className="mt-3 font-ui text-[10px] tracking-[0.14em] text-parchment">
                      {promise.title.toUpperCase()}
                    </p>
                    <p className="mt-2 font-body text-sm text-stone">{promise.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 md:px-8">
        <motion.article
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="fx-card rounded-2xl border border-smoke bg-obsidian p-7 md:p-9"
        >
          <h2 className="text-safe font-title text-4xl text-ivory">About The Book</h2>
          <p className="mt-4 font-body text-lg leading-relaxed text-parchment first-letter:float-left first-letter:mr-3 first-letter:font-title first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-gold">
            {book.synopsis}
          </p>
        </motion.article>

        <motion.article
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="grid gap-4 rounded-2xl border border-smoke bg-obsidian p-7 md:grid-cols-[1.15fr_0.85fr] md:p-9"
        >
          <div>
            <p className="font-ui text-xs tracking-[0.16em] text-gold">READER NOTES</p>
            <h2 className="mt-3 text-safe font-title text-4xl text-ivory">What To Expect From Direct Ordering</h2>
            <p className="mt-4 font-body text-lg leading-relaxed text-parchment">
              Direct orders are ideal for readers who want the publisher shelf, guest checkout, and
              reliable support from the same desk that curates the catalog.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-gold/20 bg-gold/5 p-5">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <p className="font-body text-sm text-stone">Guest checkout supported for quick orders.</p>
            </div>
            <div className="flex items-start gap-3">
              <WalletCards className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <p className="font-body text-sm text-stone">Cash on Delivery works on eligible India destinations.</p>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <p className="font-body text-sm text-stone">Need multiple copies or a reading-group order? Contact the desk.</p>
            </div>
          </div>
        </motion.article>

        <motion.blockquote
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="editorial-panel rounded-2xl p-8 md:p-10"
        >
          <p className="text-safe font-title text-4xl text-ivory md:text-5xl">
            &ldquo;{book.pullQuote}&rdquo;
          </p>
        </motion.blockquote>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <ChapterPreview content={book.chapterPreview} buyLink={book.buyLink} />
        </motion.div>

        <motion.article
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="fx-card rounded-2xl border border-smoke bg-obsidian p-7 md:p-9"
        >
          <p className="font-ui text-xs tracking-[0.16em] text-gold">ABOUT THE AUTHOR</p>
          <h3 className="mt-3 text-safe font-title text-4xl text-ivory">{book.authorName}</h3>
          <p className="mt-4 max-w-3xl font-body text-lg text-parchment/95">
            {book.authorBio ??
              "Read this author's profile for more on their work, background, and place in the catalog."}
          </p>
          {book.authorSlug ? (
            <Link
              href={`/authors/${book.authorSlug}`}
              className="fx-link mt-5 inline-block font-ui text-xs tracking-[0.14em] text-gold transition hover:text-gold-dim"
            >
              MEET THE AUTHOR
            </Link>
          ) : null}
        </motion.article>

        <motion.section
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="pb-4"
        >
          <h3 className="text-safe font-title text-4xl text-ivory">You May Also Like</h3>

          {relatedBooks.length > 0 ? (
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {relatedBooks.map((related) => (
                <Link
                  key={related.id}
                  href={`/books/${related.slug}`}
                  className="fx-card group relative w-[220px] shrink-0 overflow-hidden rounded-xl border border-smoke bg-obsidian transition hover:-translate-y-1 hover:border-gold/60"
                >
                  <div className="relative aspect-[3/4]">
                    {related.coverImageUrl ? (
                      <Image
                        src={related.coverImageUrl}
                        alt={related.title}
                        fill
                        sizes="220px"
                        className="object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <DecorativeBookCover
                        title={related.title}
                        subtitle={related.authorName}
                        compact
                        className="rounded-none border-0"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 to-transparent" />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-safe font-title text-2xl text-ivory">
                      {related.title}
                    </p>
                    <p className="font-body text-sm text-stone">{related.authorName}</p>
                    <p className="font-mono text-xs text-parchment">{formatINR(related.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-smoke bg-obsidian p-6">
              <p className="font-body text-base text-stone">
                More related titles will appear here as the catalog expands.
              </p>
            </div>
          )}
        </motion.section>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-gold/60 bg-obsidian/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PRICE</p>
            <p className="font-title text-2xl text-ivory">{formatINR(book.price)}</p>
          </div>
          <AddToCart
            bookId={book.id}
            title={book.title}
            price={book.price}
            authorName={book.authorName}
            coverImageUrl={book.coverImageUrl}
            label="ADD TO BAG"
            className="px-4 py-2.5 text-[10px]"
          />
        </div>
      </div>
    </div>
  );
}
