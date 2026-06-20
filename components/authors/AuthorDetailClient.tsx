"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Languages, Library, Medal } from "lucide-react";
import { formatINR } from "@/lib/utils";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export interface AuthorBookItem {
  id: string;
  slug: string;
  title: string;
  price?: number;
  coverImageUrl?: string;
  genres: string[];
  language?: string;
}

export interface AuthorDetailItem {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  awards?: string[];
}

interface AuthorDetailClientProps {
  author: AuthorDetailItem;
  books: AuthorBookItem[];
}

export default function AuthorDetailClient({ author, books }: AuthorDetailClientProps) {
  const uniqueGenres = Array.from(new Set(books.flatMap((book) => book.genres))).filter(Boolean);
  const uniqueLanguages = Array.from(new Set(books.map((book) => book.language).filter(Boolean)));

  return (
    <div className="grain-overlay">
      <Breadcrumbs items={[{ label: "AUTHORS", href: "/authors" }, { label: author.name }]} />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <section className="editorial-panel grid gap-8 rounded-2xl p-6 md:grid-cols-[260px_1fr] md:p-8">
        <div className="book-edge relative aspect-square overflow-hidden rounded-xl border border-smoke bg-ash">
          {author.photoUrl ? (
            <Image src={author.photoUrl} alt={author.name} fill sizes="260px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-title text-7xl text-gold/35">{author.name.trim().charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div>
          <p className="font-ui text-xs tracking-[0.15em] text-gold">AUTHOR PROFILE</p>
          <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">{author.name}</h1>
          <p className="mt-4 max-w-3xl font-body text-lg text-parchment/90">
            {author.bio ?? "An editorial profile for this author will be added here shortly."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="fx-card rounded-lg border border-smoke bg-ash/40 p-4">
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone">BOOKS</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <Library className="h-4 w-4 text-gold" />
                {books.length}
              </p>
            </div>
            <div className="fx-card rounded-lg border border-smoke bg-ash/40 p-4">
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone">GENRES</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <BookOpen className="h-4 w-4 text-gold" />
                {uniqueGenres.length}
              </p>
            </div>
            <div className="fx-card rounded-lg border border-smoke bg-ash/40 p-4">
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone">LANGUAGES</p>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-parchment">
                <Languages className="h-4 w-4 text-gold" />
                {uniqueLanguages.length || 1}
              </p>
            </div>
          </div>
        </div>
      </section>

      {author.awards && author.awards.length > 0 ? (
        <section className="editorial-panel mt-8 rounded-2xl p-6 md:p-8">
          <p className="font-ui text-xs tracking-[0.15em] text-gold">AWARDS / RECOGNITION</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {author.awards.map((award) => (
              <span
                key={`${author.id}-${award}`}
                className="inline-flex items-center gap-1 rounded-full border border-gold/35 bg-ash px-3 py-1 font-ui text-[10px] tracking-[0.11em] text-parchment"
              >
                <Medal className="h-3.5 w-3.5 text-gold" />
                {award}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-safe font-title text-4xl text-ivory">Books by {author.name}</h2>

        {books.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="fx-card group overflow-hidden rounded-xl border border-smoke bg-obsidian p-3 transition hover:border-gold/60 sm:p-4"
              >
                <div className="book-edge relative aspect-[3/4] overflow-hidden rounded-lg bg-ash">
                  {book.coverImageUrl ? (
                    <Image
                      src={book.coverImageUrl}
                      alt={book.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-b from-ash to-void">
                      <span className="font-title text-7xl text-gold/25">{book.title.trim().charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-safe font-title text-xl leading-tight text-ivory sm:mt-4 sm:text-2xl">
                  {book.title}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-parchment sm:text-xs">{formatINR(book.price)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-smoke bg-obsidian p-8 text-center">
            <p className="font-body text-lg text-stone">Published editions for this author will appear here.</p>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
