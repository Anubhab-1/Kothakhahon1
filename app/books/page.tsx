import { Suspense } from "react";
import BooksCatalogClient from "@/components/books/BooksCatalogClient";
import { getAllBooks } from "@/lib/content";
import type { CatalogBook } from "@/lib/types";

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
  };
}

export default async function BooksPage() {
  const books = (await getAllBooks()).map(mapCatalogBook);

  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8" />}>
      <BooksCatalogClient books={books} />
    </Suspense>
  );
}
