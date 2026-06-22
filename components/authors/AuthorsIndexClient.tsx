"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "@/components/ui/StaticMotion";
import Pagination from "@/components/ui/Pagination";

export interface AuthorIndexItem {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  bookCount: number;
}

interface AuthorsIndexClientProps {
  authors: AuthorIndexItem[];
  currentPage?: number;
  totalPages?: number;
}

function normalizeLetter(value: string) {
  const first = value.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export default function AuthorsIndexClient({ authors, currentPage, totalPages }: AuthorsIndexClientProps) {
  const [selectedLetter, setSelectedLetter] = useState("ALL");

  const letters = useMemo(() => {
    const values = new Set<string>();
    authors.forEach((author) => values.add(normalizeLetter(author.name)));
    const sorted = Array.from(values).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
    return ["ALL", ...sorted];
  }, [authors]);

  const filtered = useMemo(() => {
    if (selectedLetter === "ALL") return authors;
    return authors.filter((author) => normalizeLetter(author.name) === selectedLetter);
  }, [authors, selectedLetter]);

  const writers = useMemo(() => {
    return filtered.filter((author) => author.bookCount > 0);
  }, [filtered]);

  const editorialTeam = useMemo(() => {
    return filtered.filter((author) => author.bookCount === 0);
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      <p className="font-ui text-xs tracking-[0.16em] text-gold">AUTHORS</p>
      <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">The Voices We Champion</h1>
      <p className="mt-3 max-w-3xl font-body text-lg text-stone">
        Browse the authors shaping the catalog. Each profile connects biography, books, and the editorial context around the work.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => setSelectedLetter(letter)}
            className={`fx-button rounded-full border px-3 py-1.5 font-ui text-[11px] tracking-[0.12em] transition ${
              selectedLetter === letter
                ? "border-gold bg-gold text-void"
                : "border-smoke bg-obsidian text-parchment hover:border-gold hover:text-gold"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-16 mt-10">
          {writers.length > 0 && (
            <div>
              <h2 className="font-title text-xl text-gold mb-6 uppercase tracking-[0.16em]">Writers</h2>
              <motion.div
                key={`writers-${selectedLetter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {writers.map((author) => (
                  <Link
                    key={author.id}
                    href={`/authors/${author.slug}`}
                    className="fx-card group rounded-xl border border-smoke bg-obsidian/85 p-5 transition hover:border-gold/60 hover:shadow-[0_12px_36px_rgba(201,151,58,0.08)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-smoke bg-ash">
                          {author.photoUrl ? (
                            <Image
                              src={author.photoUrl}
                              alt={author.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="font-title text-2xl text-gold/70">
                                {author.name.trim().charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-safe font-title text-3xl text-ivory group-hover:text-gold transition-colors duration-200">
                            {author.name}
                          </h2>
                          <span className="inline-block mt-2 rounded-full border border-gold/45 bg-gold/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gold font-bold">
                            {author.bookCount} {author.bookCount === 1 ? "BOOK" : "BOOKS"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 font-body text-base text-parchment/90 leading-relaxed">
                        {author.bio ?? "Open the profile to see the writer's books and editorial note."}
                      </p>
                    </div>
                    <p className="fx-link mt-4 font-ui text-[11px] tracking-[0.13em] text-gold">
                      OPEN PROFILE &rarr;
                    </p>
                  </Link>
                ))}
              </motion.div>
            </div>
          )}

          {editorialTeam.length > 0 && (
            <div>
              <h2 className="font-title text-xl text-stone mb-6 uppercase tracking-[0.16em]">Editorial Team</h2>
              <motion.div
                key={`editorial-${selectedLetter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {editorialTeam.map((author) => (
                  <Link
                    key={author.id}
                    href={`/authors/${author.slug}`}
                    className="fx-card group rounded-xl border border-smoke bg-obsidian/85 p-5 transition hover:border-gold/60 hover:shadow-[0_12px_36px_rgba(201,151,58,0.08)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-smoke bg-ash">
                          {author.photoUrl ? (
                            <Image
                              src={author.photoUrl}
                              alt={author.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="font-title text-2xl text-gold/70">
                                {author.name.trim().charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-safe font-title text-3xl text-ivory group-hover:text-gold transition-colors duration-200">
                            {author.name}
                          </h2>
                          <span className="inline-block mt-2 rounded-full border border-smoke/70 bg-void/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-stone font-semibold">
                            EDITORIAL TEAM
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 font-body text-base text-parchment/90 leading-relaxed">
                        {author.bio ?? "Open the profile to see the writer's books and editorial note."}
                      </p>
                    </div>
                    <p className="fx-link mt-4 font-ui text-[11px] tracking-[0.13em] text-gold">
                      OPEN PROFILE &rarr;
                    </p>
                  </Link>
                ))}
              </motion.div>
            </div>
          )}
          {totalPages !== undefined && currentPage !== undefined && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/authors"
            />
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-smoke bg-obsidian p-8 text-center">
          <p className="font-body text-lg text-stone">The archive is currently empty for this letter.</p>
        </div>
      )}
    </div>
  );
}
