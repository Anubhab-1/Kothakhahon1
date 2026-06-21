import { Suspense } from "react";
import type { Metadata } from "next";
import BooksCatalogClient from "@/components/books/BooksCatalogClient";
import { getAllBooks, getFilteredCatalogBooks } from "@/lib/content";
import {
  getEffectiveStockStatus,
  normalizeLowStockThreshold,
  normalizeStockQuantity,
} from "@/lib/inventory";
import type { CatalogBook } from "@/lib/types";

interface BooksPageProps {
  searchParams: Promise<{
    genre?: string;
    language?: string;
    author?: string;
    q?: string;
    sort?: string;
    price?: string;
    inStock?: string;
    page?: string;
  }>;
}

export const revalidate = 60;

function mapCatalogBook(book: Awaited<ReturnType<typeof getAllBooks>>[number]): CatalogBook {
  return {
    id: book._id,
    slug: book.slug,
    title: book.title,
    authorName: book.author?.name ?? "Unknown Author",
    genreNames: (book.genre ?? []).map((genre) => genre.name).filter(Boolean),
    price: book.price,
    publicationDate: book.publicationDate,
    coverImageUrl: book.coverImageUrl,
    stockQuantity: normalizeStockQuantity(book.stockQuantity),
    lowStockThreshold: normalizeLowStockThreshold(book.lowStockThreshold),
    stockStatus: getEffectiveStockStatus(book),
    language: book.language || undefined,
    soldCount: book.soldCount,
    averageRating: book.averageRating,
  };
}

export async function generateMetadata({ searchParams }: BooksPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();
  const genre = params.genre?.trim();
  const language = params.language?.trim();
  const author = params.author?.trim();

  let title = "Books Catalog | Kothakhahon";
  let description = "Browse our full collection of books, including classical and modern Bengali literature, poetry, essays, and translations.";

  if (q) {
    title = `Search Results for "${q}" | Kothakhahon`;
    description = `Explore search results for "${q}" in the Kothakhahon catalog of Bengali literature.`;
  } else if (genre && genre !== "all") {
    const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
    title = `${genreName} Books | Kothakhahon`;
    description = `Browse our selection of ${genreName} books in the Kothakhahon catalog.`;
  } else if (language) {
    const langName = language.charAt(0).toUpperCase() + language.slice(1);
    title = `${langName} Language Books | Kothakhahon`;
    description = `Browse Bengali and English language publications in the Kothakhahon catalog.`;
  } else if (author) {
    title = `Books by ${author} | Kothakhahon`;
    description = `Browse books written by ${author} published by Kothakhahon Prokashoni.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: "/books",
    },
    openGraph: {
      title,
      description,
      url: "/books",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 12;

  const { items: paginatedBooks, totalCount } = await getFilteredCatalogBooks({
    page,
    limit,
    q: params.q,
    genre: params.genre,
    author: params.author,
    language: params.language,
    inStock: params.inStock === "true",
    price: params.price,
    sort: params.sort,
  });

  const allBooks = await getAllBooks();

  const catalogBooks = paginatedBooks.map(mapCatalogBook);
  const allCatalogBooks = allBooks.map(mapCatalogBook);
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8" />}>
      <BooksCatalogClient
        books={catalogBooks}
        allBooks={allCatalogBooks}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </Suspense>
  );
}

