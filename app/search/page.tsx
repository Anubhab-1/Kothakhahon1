import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search, BookOpen, User, FileText, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import SearchBoxClient from "@/components/search/SearchBoxClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
  };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const isSearching = query.length >= 2;

  const [books, authors, posts] = isSearching
    ? await Promise.all([
        db.book.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { titleEn: { contains: query, mode: "insensitive" } },
              { author: { name: { contains: query, mode: "insensitive" } } },
              { genres: { some: { genre: { name: { contains: query, mode: "insensitive" } } } } },
            ],
          },
          include: { author: true },
          take: 12,
        }),
        db.author.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 6,
        }),
        db.blogPost.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { author: true },
          take: 6,
        }),
      ])
    : [[], [], []];

  const totalResults = books.length + authors.length + posts.length;

  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      {/* Search bar */}
      <SearchBoxClient initialQuery={query} />

      {/* State: idle */}
      {!isSearching && (
        <div className="mt-16 text-center">
          <Search className="mx-auto h-12 w-12 text-stone/30" />
          <p className="mt-4 font-title text-2xl text-ivory">Search the catalog</p>
          <p className="mt-2 font-body text-base text-stone">
            Find books by title, author, or genre — or search journal posts and essays.
          </p>
        </div>
      )}

      {/* State: no results */}
      {isSearching && totalResults === 0 && (
        <div className="mt-16 text-center">
          <SearchX className="mx-auto h-12 w-12 text-stone/30" />
          <p className="mt-4 font-title text-2xl text-ivory">No results for &ldquo;{query}&rdquo;</p>
          <p className="mt-2 font-body text-base text-stone">
            Try a different keyword, check the spelling, or{" "}
            <Link href="/books" className="fx-link text-gold hover:text-gold-dim">
              browse the full catalog
            </Link>
            .
          </p>
        </div>
      )}

      {/* Results */}
      {isSearching && totalResults > 0 && (
        <div className="mt-8 space-y-12">
          <p className="font-ui text-[11px] tracking-[0.18em] text-stone">
            {totalResults} RESULT{totalResults !== 1 ? "S" : ""} FOR &ldquo;{query}&rdquo;
          </p>

          {/* Books */}
          {books.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                <h2 className="font-ui text-[11px] tracking-[0.18em] text-gold">
                  BOOKS ({books.length})
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="fx-card group flex gap-4 rounded-2xl border border-smoke bg-obsidian p-4 transition hover:-translate-y-0.5 hover:border-gold/50"
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-obsidian">
                          <BookOpen className="h-6 w-6 text-stone/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-safe font-title text-lg text-ivory">
                        {book.title}
                      </p>
                      <p className="mt-1 truncate font-body text-sm text-stone">
                        {book.author?.name ?? "Unknown Author"}
                      </p>
                      {book.price != null && (
                        <p className="mt-2 font-mono text-xs text-gold">
                          {formatINR(book.price)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {books.length === 12 && (
                <Link
                  href={`/books?q=${encodeURIComponent(query)}`}
                  className="fx-link mt-4 inline-block font-ui text-[11px] tracking-[0.14em] text-gold hover:text-gold-dim"
                >
                  SEE ALL BOOKS →
                </Link>
              )}
            </section>
          )}

          {/* Authors */}
          {authors.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                <h2 className="font-ui text-[11px] tracking-[0.18em] text-gold">
                  AUTHORS ({authors.length})
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/authors/${author.slug}`}
                    className="fx-card flex items-center gap-4 rounded-2xl border border-smoke bg-obsidian p-4 transition hover:-translate-y-0.5 hover:border-gold/50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-void">
                      {author.photoUrl ? (
                        <Image
                          src={author.photoUrl}
                          alt={author.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-5 w-5 text-stone/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-title text-xl text-ivory">{author.name}</p>
                      {author.bio && (
                        <p className="mt-0.5 line-clamp-1 font-body text-sm text-stone">
                          {author.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Blog posts */}
          {posts.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold" />
                <h2 className="font-ui text-[11px] tracking-[0.18em] text-gold">
                  JOURNAL ({posts.length})
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="fx-card rounded-2xl border border-smoke bg-obsidian p-5 transition hover:-translate-y-0.5 hover:border-gold/50"
                  >
                    {post.category && (
                      <p className="mb-2 font-ui text-[10px] tracking-[0.14em] text-gold">
                        {post.category.toUpperCase()}
                      </p>
                    )}
                    <p className="line-clamp-2 font-title text-xl text-ivory">{post.title}</p>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 font-body text-sm text-stone">
                        {post.excerpt}
                      </p>
                    )}
                    {post.author && (
                      <p className="mt-3 font-ui text-[10px] tracking-[0.12em] text-parchment/60">
                        {post.author.name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
