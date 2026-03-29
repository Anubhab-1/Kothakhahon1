"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "@/components/ui/StaticMotion";

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
}

function normalizeLetter(value: string) {
  const first = value.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export default function AuthorsIndexClient({ authors }: AuthorsIndexClientProps) {
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      <p className="font-ui text-xs tracking-[0.16em] text-gold">AUTHORS</p>
      <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">Writers In The Kothakhahon List</h1>
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
        <motion.div
          key={selectedLetter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((author) => (
            <Link
              key={author.id}
              href={`/authors/${author.slug}`}
              className="fx-card group rounded-xl border border-smoke bg-obsidian p-5 transition hover:border-gold/60"
            >
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
                  <h2 className="line-clamp-2 text-safe font-title text-3xl text-ivory">
                    {author.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-stone">
                    {author.bookCount > 0
                      ? `${author.bookCount} ${author.bookCount === 1 ? "book" : "books"}`
                      : "Editorial voice"}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 font-body text-base text-parchment/90">
                {author.bio ?? "Open the profile to see the writer's books and editorial note."}
              </p>
              <p className="fx-link mt-4 font-ui text-[11px] tracking-[0.13em] text-gold">
                OPEN PROFILE
              </p>
            </Link>
          ))}
        </motion.div>
      ) : (
        <div className="mt-8 rounded-xl border border-smoke bg-obsidian p-8 text-center">
          <p className="font-body text-lg text-stone">No author profiles match this letter yet.</p>
        </div>
      )}
    </div>
  );
}
