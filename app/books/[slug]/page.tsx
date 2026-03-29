import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookDetailClient from "@/components/books/BookDetailClient";
import { getAllBooks, getBookBySlug, getRelatedBooks } from "@/lib/content";
import type { BookDetailView, RelatedBook } from "@/lib/types";

interface BookDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

function mapBookToDetail(book: NonNullable<Awaited<ReturnType<typeof getBookBySlug>>>): BookDetailView {
  const mappedGenres = (book.genre ?? []).map((genre) => genre.name).filter(Boolean);
  const reviewCount = book.reviewCount ?? 0;

  return {
    id: book._id,
    slug: book.slug,
    title: book.title,
    titleEn: book.titleEn,
    coverImageUrl: book.coverImageUrl,
    authorName: book.author?.name ?? "Unknown Author",
    authorSlug: book.author?.slug,
    authorBio: book.author?.bio,
    genres: mappedGenres.length > 0 ? mappedGenres : ["Literary Fiction"],
    synopsis:
      book.synopsis ??
      "A compelling literary work exploring identity, memory, and the changing social texture of Bengal.",
    pullQuote: book.pullQuote ?? "Stories remain where official history refuses to look.",
    chapterPreview:
      book.chapterPreview ??
      "The first page opened with dust and a date.\n\nHe did not yet know that every room in this house had kept a different version of the same story.",
    price: book.price,
    buyLink: book.buyLink,
    publicationDate: book.publicationDate,
    pageCount: book.pageCount,
    isbn: book.isbn,
    language: book.language,
    averageRating: reviewCount > 0 ? (book.averageRating ?? 4.5) : 0,
    reviewCount,
  };
}

function mapRelatedBook(book: Awaited<ReturnType<typeof getAllBooks>>[number]): RelatedBook {
  return {
    id: book._id,
    slug: book.slug,
    title: book.title,
    authorName: book.author?.name ?? "Unknown Author",
    price: book.price,
    coverImageUrl: book.coverImageUrl,
  };
}

export async function generateStaticParams() {
  const books = await getAllBooks();
  return books.map((book) => ({ slug: book.slug }));
}

async function getBookData(slug: string) {
  const book = await getBookBySlug(slug);
  if (!book) {
    return null;
  }

  const relatedBooks = await getRelatedBooks(slug, book.author?._id ?? "");

  return {
    book: mapBookToDetail(book),
    related: relatedBooks.slice(0, 6).map(mapRelatedBook),
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const bookData = await getBookData(slug);

  if (!bookData) {
    notFound();
  }

  return <BookDetailClient book={bookData.book} relatedBooks={bookData.related} />;
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBookData(slug);

  if (!data) {
    notFound();
  }

  return {
    title: data.book.title,
    description: data.book.synopsis.slice(0, 160),
    alternates: {
      canonical: `/books/${data.book.slug}`,
    },
    openGraph: {
      title: data.book.title,
      description: data.book.synopsis.slice(0, 160),
      type: "book",
      url: `/books/${data.book.slug}`,
      images: [data.book.coverImageUrl || "/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: data.book.title,
      description: data.book.synopsis.slice(0, 160),
      images: [data.book.coverImageUrl || "/twitter-image"],
    },
  };
}
