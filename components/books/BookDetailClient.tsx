"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, Suspense } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
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
import Accordion from "@/components/ui/Accordion";
import ChapterPreview from "@/components/ui/ChapterPreview";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";
import StarRating from "@/components/ui/StarRating";
import ShareButton from "@/components/ui/ShareButton";
import WishlistButton from "@/components/ui/WishlistButton";
import { createBookReviewAction } from "@/app/reviews/actions";
import { formatDisplayDate } from "@/lib/date";
import { getStockStatusLabel, isBookAvailableForSale } from "@/lib/inventory";
import type { BookDetailView, BookReviewView, RelatedBook } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { getSiteUrlString } from "@/lib/env";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { useSearchParams } from "next/navigation";
import { usePublicSession } from "@/components/auth/PublicSessionProvider";

interface BookDetailClientProps {
  book: BookDetailView;
  moreByAuthor: RelatedBook[];
  youMightAlsoLike: RelatedBook[];
  reviews: BookReviewView[];
}

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function BookDetailClient({
  book,
  moreByAuthor,
  youMightAlsoLike,
  reviews,
}: BookDetailClientProps) {
  const session = usePublicSession();

  const isAvailable = isBookAvailableForSale(book);
  const stockStatusLabel = getStockStatusLabel(book.stockStatus);
  const stockMessage =
    book.stockStatus === "out_of_stock"
      ? "This title is temporarily unavailable for checkout."
      : book.stockStatus === "low_stock"
        ? `Only ${book.stockQuantity} copies are currently left in stock.`
        : `${book.stockQuantity} copies are currently available for dispatch.`;

  const allImages = [book.coverImageUrl, ...(book.galleryImages || [])].filter(Boolean) as string[];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const body = JSON.stringify({ bookId: book.id });
    const url = `/api/books/${encodeURIComponent(book.id)}/view`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }

    fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch((err) => console.warn("Failed to log book view:", err));
  }, [book.id]);

  // Sticky buy bar — shows on mobile when main CTA scrolls out of view
  const buyButtonRef = useRef<HTMLDivElement>(null);
  const buyButtonVisible = useIntersectionObserver(buyButtonRef, { threshold: 0 });

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
      <Breadcrumbs items={[{ label: "BOOKS", href: "/books" }, { label: book.title }]} />
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
        <motion.div variants={reveal} initial="hidden" animate="show" transition={{ duration: 0.45 }}>
          <div className="editorial-panel rounded-2xl p-5 md:p-6">
            <TiltedBookCover
              title={book.title}
              authorName={book.authorName}
              coverImageUrl={allImages[activeImageIndex] || book.coverImageUrl}
            />
            {allImages.length > 1 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1} of ${book.title}`}
                    className={`relative h-16 w-12 overflow-hidden rounded-md border transition-all ${
                      activeImageIndex === idx
                        ? "border-gold ring-1 ring-gold bg-gold/10 scale-105"
                        : "border-smoke bg-obsidian hover:border-gold/40"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Cover image ${idx + 1} of ${book.title}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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
            <div aria-label={`Average ${book.averageRating} out of 5 from ${book.reviewCount} reviews`}>
              <StarRating rating={book.averageRating} count={book.reviewCount} size="lg" />
            </div>
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
            <div className="mt-1 flex items-baseline gap-3 flex-wrap">
              <span className="font-title text-4xl text-ivory">{formatINR(book.price)}</span>
              {book.compareAtPrice && book.price && book.compareAtPrice > book.price && (
                <>
                  <span className="font-title text-2xl text-stone line-through">{formatINR(book.compareAtPrice)}</span>
                  <span className="rounded bg-gold/10 px-2 py-0.5 font-ui text-[10px] font-bold tracking-wider text-gold">
                    SAVE {Math.round(((book.compareAtPrice - book.price) / book.compareAtPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 font-ui text-[11px] tracking-[0.14em] text-gold">
              {stockStatusLabel.toUpperCase()}
            </p>
            <p className="mt-3 max-w-2xl font-body text-base text-stone">
              {stockMessage}
            </p>
            <div ref={buyButtonRef} className="mt-5 flex flex-wrap gap-3">
              <AddToCart
                bookId={book.id}
                title={book.title}
                price={book.price}
                authorName={book.authorName}
                coverImageUrl={book.coverImageUrl}
                disabled={!isAvailable}
              />
              <WishlistButton bookId={book.id} bookSlug={book.slug} />
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
              <ShareButton
                title={book.title}
                text={`${book.title} by ${book.authorName} — ${book.synopsis.slice(0, 120)}…`}
                url={`${getSiteUrlString()}/books/${book.slug}`}
              />
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

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <Accordion
            items={[
              {
                id: "specs",
                title: "Edition Specifications",
                content: (
                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    <div className="fx-card rounded-lg border border-smoke bg-obsidian/40 p-4">
                      <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PUBLISHER</p>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                        <ScrollText className="h-4 w-4 text-gold shrink-0" />
                        {book.publisher ?? "Kothakhahon Prokashoni"}
                      </p>
                    </div>
                    <div className="fx-card rounded-lg border border-smoke bg-obsidian/40 p-4">
                      <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PUBLICATION DATE</p>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                        <CalendarDays className="h-4 w-4 text-gold shrink-0" />
                        {formatDisplayDate(book.publicationDate, "Unknown")}
                      </p>
                    </div>
                    <div className="fx-card rounded-lg border border-smoke bg-obsidian/40 p-4">
                      <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PAGE COUNT</p>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                        <BookOpenText className="h-4 w-4 text-gold shrink-0" />
                        {book.pageCount ?? "Unknown"}
                      </p>
                    </div>
                    <div className="fx-card rounded-lg border border-smoke bg-obsidian/40 p-4">
                      <p className="font-ui text-[10px] tracking-[0.13em] text-stone">ISBN</p>
                      <p className="mt-2 flex items-center gap-2 font-mono text-xs text-parchment">
                        <Barcode className="h-4 w-4 text-gold shrink-0" />
                        {book.isbn ?? "Not listed"}
                      </p>
                    </div>
                    <div className="fx-card rounded-lg border border-smoke bg-obsidian/40 p-4">
                      <p className="font-ui text-[10px] tracking-[0.13em] text-stone">LANGUAGE</p>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                        <Languages className="h-4 w-4 text-gold shrink-0" />
                        {book.language ?? "Bengali"}
                      </p>
                    </div>
                  </div>
                ),
              },
              ...(book.tableOfContents
                ? [
                    {
                      id: "toc",
                      title: "Table Of Contents",
                      content: (
                        <div className="pt-2 font-body text-base text-parchment/90 leading-relaxed whitespace-pre-line">
                          {book.tableOfContents}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </motion.div>

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

        <motion.section
          id="reviews"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="fx-card rounded-2xl border border-smoke bg-obsidian p-7 md:p-9">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">READER REVIEWS</p>
            <h2 className="mt-3 text-safe font-title text-4xl text-ivory">Share Your Reading</h2>
            <p className="mt-3 font-body text-base leading-relaxed text-stone">
              Reviews are moderated before they appear publicly. Verified purchase badges are added automatically for readers who ordered this title while signed in.
            </p>
            <Suspense fallback={null}>
              <ReviewFeedbackBanners />
            </Suspense>

            {session ? (
              <form action={createBookReviewAction} className="mt-6 space-y-4">
                <input type="hidden" name="bookId" value={book.id} />
                <input type="hidden" name="bookSlug" value={book.slug} />

                <label className="block space-y-2">
                  <span className="font-ui text-xs tracking-[0.13em] text-parchment">DISPLAY NAME</span>
                  <input
                    name="reviewerName"
                    type="text"
                    defaultValue={session.fullName ?? ""}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                    placeholder="Your name"
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="font-ui text-xs tracking-[0.13em] text-parchment">RATING</legend>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <label
                        key={rating}
                        className="cursor-pointer rounded-full border border-smoke bg-void px-3 py-1.5 font-mono text-xs text-parchment transition hover:border-gold hover:text-gold"
                      >
                        <input className="sr-only" type="radio" name="rating" value={rating} required />
                        {rating} STAR{rating > 1 ? "S" : ""}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block space-y-2">
                  <span className="font-ui text-xs tracking-[0.13em] text-parchment">TITLE</span>
                  <input
                    name="title"
                    type="text"
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                    placeholder="A short headline"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-ui text-xs tracking-[0.13em] text-parchment">REVIEW</span>
                  <textarea
                    name="body"
                    rows={5}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                    placeholder="What should another reader know?"
                  />
                </label>

                <button
                  type="submit"
                  className="fx-button rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
                >
                  SUBMIT REVIEW
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-smoke bg-void/50 p-6 text-center">
                <p className="font-body text-base text-stone">
                  You must be signed in to submit a reader review.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/books/${book.slug}#reviews`)}`}
                  className="fx-button mt-4 inline-block rounded-full border border-gold bg-gold px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
                >
                  SIGN IN TO REVIEW
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="fx-card rounded-2xl border border-smoke bg-obsidian p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-ui text-xs tracking-[0.14em] text-gold">
                        {review.reviewerName.toUpperCase()}
                      </p>
                      <p className="mt-1 font-mono text-xs text-stone">
                        {formatDisplayDate(review.createdAt, "Recent")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating rating={review.rating} size="sm" showCount={false} />
                      {review.purchaseVerified ? (
                        <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 font-ui text-[10px] tracking-[0.12em] text-gold">
                          VERIFIED
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {review.title ? (
                    <h3 className="mt-4 font-title text-2xl text-ivory">{review.title}</h3>
                  ) : null}
                  {review.body ? (
                    <p className="mt-2 font-body text-base leading-relaxed text-stone">{review.body}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="fx-card rounded-2xl border border-smoke bg-obsidian p-7">
                <p className="font-ui text-xs tracking-[0.16em] text-gold">NO REVIEWS YET</p>
                <p className="mt-3 font-body text-base text-stone">
                  Approved reader reviews will appear here after moderation.
                </p>
              </div>
            )}
          </div>
        </motion.section>

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

        {moreByAuthor.length > 0 && (
          <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45 }}
            className="pb-4"
          >
            <h3 className="text-safe font-title text-4xl text-ivory">More by this Author</h3>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {moreByAuthor.map((related) => (
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
          </motion.section>
        )}

        {youMightAlsoLike.length > 0 && (
          <motion.section
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45 }}
            className="pb-4"
          >
            <h3 className="text-safe font-title text-4xl text-ivory">You Might Also Like</h3>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {youMightAlsoLike.map((related) => (
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
          </motion.section>
        )}
      </section>

      {/* Sticky mobile buy bar — slides up when main CTA is out of view */}
      <div
        className={`fixed inset-x-3 bottom-3 z-50 rounded-xl border border-gold/60 bg-obsidian/95 p-3 backdrop-blur transition-all duration-300 md:hidden ${
          buyButtonVisible ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-ui text-[10px] tracking-[0.13em] text-stone">PRICE</p>
            <div className="flex items-baseline gap-2">
              <span className="font-title text-2xl text-ivory">{formatINR(book.price)}</span>
              {book.compareAtPrice && book.price && book.compareAtPrice > book.price && (
                <span className="font-title text-base text-stone line-through">{formatINR(book.compareAtPrice)}</span>
              )}
            </div>
          </div>
          <AddToCart
            bookId={book.id}
            title={book.title}
            price={book.price}
            authorName={book.authorName}
            coverImageUrl={book.coverImageUrl}
            disabled={!isAvailable}
            label="ADD TO BAG"
            className="px-4 py-2.5 text-[10px]"
          />
        </div>
      </div>
    </div>
  );
}

function ReviewFeedbackBanners() {
  const searchParams = useSearchParams();
  const reviewParam = searchParams.get("review");

  if (!reviewParam) return null;

  return (
    <>
      {reviewParam === "submitted" && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-left">
          <p className="font-ui text-[10px] tracking-[0.12em] text-gold font-bold">SUCCESS</p>
          <p className="mt-1 font-body text-sm text-parchment">
            Thank you! Your review has been submitted and is currently queued for editorial moderation.
          </p>
        </div>
      )}
      {reviewParam === "invalid" && (
        <div className="mt-4 rounded-xl border border-ember/30 bg-ember/5 p-4 text-left">
          <p className="font-ui text-[10px] tracking-[0.12em] text-ember font-bold">ERROR</p>
          <p className="mt-1 font-body text-sm text-parchment">
            Submission failed. Please make sure display name, title, review body, and a 1-5 star rating are provided.
          </p>
        </div>
      )}
      {reviewParam === "admin" && (
        <div className="mt-4 rounded-xl border border-ember/30 bg-ember/5 p-4 text-left">
          <p className="font-ui text-[10px] tracking-[0.12em] text-ember font-bold">ADMIN ACCOUNT</p>
          <p className="mt-1 font-body text-sm text-parchment">
            Admin accounts cannot submit catalog reviews. Please log in as a customer.
          </p>
        </div>
      )}
    </>
  );
}
