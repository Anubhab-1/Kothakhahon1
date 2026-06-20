"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, CreditCard, PackageCheck, ScrollText } from "lucide-react";
import BookCard from "@/components/ui/BookCard";
import NewsletterForm from "@/components/ui/NewsletterForm";
import SectionHeader from "@/components/ui/SectionHeader";
import { motion } from "@/components/ui/StaticMotion";
import type { Author, BlogPost, Book } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HomePageClientProps {
  allBooks: Book[];
  featuredBooks: Book[];
  latestPosts: BlogPost[];
  featuredAuthor: Author | null;
  heroTagline?: string;
  heroTaglineEn?: string;
  missionStatement?: string;
}

const genreCards = [
  {
    name: "Literary Fiction",
    description: "Narratives shaped by character depth, social texture, and language craft.",
  },
  {
    name: "Essays",
    description: "Long-form arguments and reflective writing from contemporary thinkers.",
  },
  {
    name: "Poetry",
    description: "Curated voices from modern and classical traditions in elegant editions.",
  },
  {
    name: "Narrative Non-Fiction",
    description: "Biography, criticism, and cultural writing for serious readers.",
  },
];

const readerPromises = [
  {
    title: "Cash On Delivery",
    description: "Available for eligible India orders at checkout.",
    icon: CreditCard,
  },
  {
    title: "Guest Checkout",
    description: "Readers can order directly without creating an account first.",
    icon: PackageCheck,
  },
  {
    title: "Packed In Kolkata",
    description: "Orders are handled from the publishing desk and shipping queue in Kolkata.",
    icon: BookOpen,
  },
  {
    title: "Editorial Support",
    description: "Questions on books, gifting, or submissions are answered by a real desk.",
    icon: ScrollText,
  },
];

const sectionTransition = { duration: 0.56, ease: "easeOut" as const };

function containsBengali(text?: string) {
  if (!text) return false;
  return /[\u0980-\u09FF]/.test(text);
}

function withFallbackText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function getComparableDate(dateValue?: string) {
  if (!dateValue) return 0;
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortBooksByDate(books: Book[]) {
  return [...books].sort(
    (a, b) => getComparableDate(b.publicationDate) - getComparableDate(a.publicationDate),
  );
}

export default function HomePageClient({
  allBooks,
  featuredBooks,
  latestPosts,
  featuredAuthor,
  heroTagline,
  heroTaglineEn,
  missionStatement,
}: HomePageClientProps) {
  const heroHeading = withFallbackText(heroTagline, "Books that stay with the reader.");
  const heroSubheading = withFallbackText(
    heroTaglineEn,
    "An independent Bengali publisher building literary fiction, essays, and collectible editions with real editorial weight.",
  );
  const missionCopy = withFallbackText(
    missionStatement,
    "We publish for re-reading, recommendation, and conversation that lasts beyond a launch week.",
  );
  const heroIsBengali = containsBengali(heroHeading);
  const missionIsBengali = containsBengali(missionCopy);

  const allCatalogBooks = allBooks.length > 0 ? allBooks : featuredBooks;
  const sortedBooks = sortBooksByDate(allCatalogBooks);
  const newReleases = sortedBooks.slice(0, 4);
  const affordableEditions = sortedBooks.filter((book) => typeof book.price === "number" && book.price < 400).slice(0, 4);

  return (
    <div className="grain-overlay">
      <section className="relative flex min-h-[86vh] overflow-hidden border-b border-gold/20">
        <div className="absolute inset-0 z-[-2]">
          <Image
            src="/images/hero-bg-desk.png"
            alt="Cinematic desk scene with open antique book, inkwell, and feather quills"
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-[75%_center]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[-1] bg-gradient-to-r from-obsidian/95 via-obsidian/60 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionTransition}
          className="relative mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-16 md:px-8"
        >
          <div className="relative z-10 max-w-xl space-y-8">
            <span className="editorial-badge inline-flex rounded-full px-4 py-1.5 font-ui text-[10px] tracking-[0.2em]">
              INDEPENDENT BENGALI PUBLISHER / BOOKSTORE
            </span>

            <div className="space-y-5">
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.75 }}
                className={cn(
                  "gold-shimmer inline-flex flex-wrap gap-x-3 pb-[0.1em] pt-[0.16em] text-5xl text-ivory md:text-7xl",
                  heroIsBengali ? "bn-safe font-bn" : "text-safe font-title",
                )}
              >
                {heroHeading}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="max-w-2xl font-body text-xl text-parchment/95 md:text-2xl"
              >
                {heroSubheading}
              </motion.p>
            </div>

            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/books"
                className="rounded-full bg-gradient-to-r from-[#DFB362] to-[#B98E3A] px-9 py-3.5 font-title text-lg font-medium text-[#16130D] shadow-xl transition-all duration-300 hover:brightness-110"
              >
                Browse The Catalog
              </Link>
              <Link
                href="/books?sort=newest"
                className="rounded-full border border-gold/45 bg-void/55 px-9 py-3.5 font-title text-lg font-medium text-ivory shadow-xl transition-all duration-300 hover:border-gold hover:text-gold"
              >
                Shop New Releases
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 font-ui text-[11px] tracking-[0.14em] text-parchment/80">
              <span className="rounded-full border border-smoke/70 px-3 py-1">GUEST CHECKOUT</span>
              <span className="rounded-full border border-smoke/70 px-3 py-1">COD IN INDIA</span>
              <span className="rounded-full border border-smoke/70 px-3 py-1">OPEN SUBMISSIONS</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-y border-smoke bg-[linear-gradient(90deg,rgba(17,15,13,0.98),rgba(30,25,18,0.96),rgba(17,15,13,0.98))]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-2 md:px-8 xl:grid-cols-4">
          {readerPromises.map((promise) => {
            const Icon = promise.icon;
            return (
              <article key={promise.title} className="flex items-start gap-3 rounded-2xl border border-smoke/80 bg-black/10 p-4">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-ui text-[11px] tracking-[0.14em] text-parchment">{promise.title.toUpperCase()}</p>
                  <p className="mt-1 font-body text-sm text-stone">{promise.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="border-y border-smoke bg-obsidian/70 py-3">
        <div className="animate-[ticker_20s_linear_infinite] whitespace-nowrap font-ui text-[11px] tracking-[0.2em] text-parchment">
          NEW RELEASES / EDITORIAL NOTES / AUTHOR FEATURES / GIFTABLE EDITIONS / NEW RELEASES / EDITORIAL NOTES / AUTHOR FEATURES / GIFTABLE EDITIONS /
        </div>
      </div>


      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader
          eyebrow="FEATURED STORE"
          title="Selected From The Current List"
          description="Books we would place face-out on the front table right now."
        />
        <div className="mt-4 ink-divider" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featuredBooks.length > 0 ? (
            featuredBooks.slice(0, 8).map((book) => <BookCard key={book._id} book={book} />)
          ) : (
            <div className="col-span-full rounded-xl border border-smoke bg-obsidian p-6">
              <p className="font-body text-base text-stone">
                Featured editions will appear here as new titles are added to the list.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader
          eyebrow="JUST ARRIVED"
          title="Fresh From The Desk"
          description="Recently added books for returning readers who want to see what changed on the shelf."
        />
        <div className="mt-4 ink-divider" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {newReleases.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader
          eyebrow="READER-FRIENDLY"
          title="Good Entry Points Under INR 400"
          description="A useful shelf for gifting, first orders, and readers discovering the press."
        />
        <div className="mt-4 ink-divider" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {affordableEditions.length > 0 ? (
            affordableEditions.map((book) => (
              <BookCard key={book._id} book={book} />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-smoke bg-obsidian p-6">
              <p className="font-body text-base text-stone">
                Lower-priced editions will appear here as the catalog grows.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-6xl px-4 pb-20 md:px-8"
      >
        <div className="editorial-panel rounded-2xl p-8 md:p-12">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">OUR EDITORIAL PROMISE</p>
          <blockquote
            className={cn(
              "mt-4 text-4xl text-ivory md:text-5xl",
              missionIsBengali ? "bn-safe font-bn" : "text-safe font-title",
            )}
          >
            {missionCopy}
          </blockquote>
          <p className="mt-5 max-w-3xl font-body text-lg text-stone">
            Every book is shaped through deliberate editing, careful design, and practical distribution planning.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader eyebrow="PUBLISHING PROGRAMS" title="What We Publish" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {genreCards.map((genre) => (
            <article
              key={genre.name}
              className="fx-card group rounded-xl border border-smoke bg-obsidian p-6 transition hover:border-gold/60"
            >
              <p className="font-ui text-[10px] tracking-[0.16em] text-gold">CATEGORY</p>
              <h3 className="mt-2 text-safe font-title text-3xl text-ivory">{genre.name}</h3>
              <p className="mt-3 font-body text-base text-stone transition group-hover:text-parchment">
                {genre.description}
              </p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader eyebrow="AUTHOR SPOTLIGHT" title="Voices We Champion" />
        <Link
          href={featuredAuthor ? `/authors/${featuredAuthor.slug}` : "/authors"}
          className="fx-card group mt-8 grid gap-6 rounded-2xl border border-smoke bg-obsidian p-6 transition hover:border-gold/60 md:grid-cols-[240px_1fr] md:p-8"
          aria-label={`Open author ${featuredAuthor?.name ?? "profile"}`}
        >
          <div className="book-edge relative aspect-square overflow-hidden rounded-xl border border-smoke bg-gradient-to-br from-ash to-void">
            {featuredAuthor?.photoUrl ? (
              <Image
                src={featuredAuthor.photoUrl}
                alt={featuredAuthor.name}
                fill
                sizes="240px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-title text-6xl text-gold/30">
                  {(featuredAuthor?.name?.trim().charAt(0) ?? "A").toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-safe font-title text-4xl text-ivory">
              {featuredAuthor?.name ?? "Featured Author"}
            </h3>
            <p className="mt-4 font-body text-lg text-parchment/90">
              {featuredAuthor?.bio ??
                "A writer in our list whose work reflects the editorial character of the press."}
            </p>
            <span className="fx-link mt-6 inline-block font-ui text-xs tracking-[0.14em] text-gold transition group-hover:text-gold-dim">
              MEET THE AUTHOR
            </span>
          </div>
        </Link>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <div className="fx-card rounded-2xl border border-gold/45 bg-gradient-to-r from-obsidian via-ash to-obsidian p-8 text-center md:p-12">
          <p className="font-ui text-xs tracking-[0.18em] text-gold">FOR WRITERS</p>
          <h3 className="mt-3 text-safe font-title text-4xl text-ivory md:text-5xl">
            Have a manuscript with staying power?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl font-body text-lg text-stone">
            We are currently reading Bengali fiction, essays, poetry, and narrative non-fiction with a clear editorial identity.
          </p>
          <Link
            href="/for-authors"
            className="fx-button mt-6 inline-flex rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            REVIEW SUBMISSION GUIDE
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader
          eyebrow="LATEST WRITING"
          title="From The Kothakhahon Journal"
          description="Editorial notes, author conversations, and long-form reflections."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="fx-card group block rounded-xl border border-smoke bg-obsidian p-5 transition hover:border-gold/60"
                aria-label={`Open blog post ${post.title}`}
              >
                <p className="font-ui text-[10px] tracking-[0.14em] text-gold">
                  {(post.category ?? "Journal").toUpperCase()}
                </p>
                <h3 className="mt-3 text-safe font-title text-3xl text-ivory">{post.title}</h3>
                <p className="mt-3 font-body text-base text-parchment/90">
                  {post.excerpt ?? "Open the full essay from the Kothakhahon journal."}
                </p>
                <span className="fx-link mt-4 inline-block font-ui text-[11px] tracking-[0.14em] text-gold transition group-hover:text-gold-dim">
                  OPEN ESSAY
                </span>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-smoke bg-obsidian p-6">
              <p className="font-body text-base text-stone">
                New essays and editorial notes will appear here.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={sectionTransition}
        className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8"
      >
        <div className="editorial-panel rounded-2xl p-8 md:p-12">
          <SectionHeader
            align="center"
            eyebrow="READER CLUB"
            title="Get New Releases Before Everyone Else"
            description="Receive launch updates, essay drops, and early access to featured titles."
            className="mx-auto max-w-3xl"
          />
          <div className="mt-8 flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
