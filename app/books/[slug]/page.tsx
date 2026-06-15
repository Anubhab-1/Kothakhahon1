import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookDetailClient from "@/components/books/BookDetailClient";
import { getAllBooks, getBookBySlug, getRelatedBooks } from "@/lib/content";
import {
  getEffectiveStockStatus,
  normalizeLowStockThreshold,
  normalizeStockQuantity,
} from "@/lib/inventory";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
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
  const stockQuantity = normalizeStockQuantity(book.stockQuantity);
  const lowStockThreshold = normalizeLowStockThreshold(book.lowStockThreshold);

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
    stockQuantity,
    lowStockThreshold,
    stockStatus: getEffectiveStockStatus(book),
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

async function getBookData(slug: string, userId?: string) {
  const book = await getBookBySlug(slug);
  if (!book) {
    return null;
  }

  const [relatedBooks, wishlistItem, approvedReviews, userReview] = await Promise.all([
    getRelatedBooks(slug, book.author?._id ?? ""),
    userId
      ? db.wishlistItem.findUnique({
          where: { userId_bookId: { userId, bookId: book._id } },
          select: { id: true },
        })
      : null,
    db.review.findMany({
      where: { bookId: book._id, approved: true },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        title: true,
        body: true,
        purchaseVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    userId
      ? db.review.findUnique({
          where: { userId_bookId: { userId, bookId: book._id } },
          select: { id: true },
        })
      : null,
  ]);

  return {
    book: mapBookToDetail(book),
    related: relatedBooks.slice(0, 6).map(mapRelatedBook),
    isSaved: !!wishlistItem,
    reviews: approvedReviews,
    hasReviewed: !!userReview,
  };
}

import { env } from "@/lib/env";

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const session = await getSession();
  const bookData = await getBookData(slug, session?.userId);

  if (!bookData) {
    notFound();
  }

  // Resolve cover image absolute URL
  const coverUrl = bookData.book.coverImageUrl
    ? (bookData.book.coverImageUrl.startsWith("http")
      ? bookData.book.coverImageUrl
      : `${env.SITE_URL}${bookData.book.coverImageUrl.startsWith("/") ? "" : "/"}${bookData.book.coverImageUrl}`)
    : `${env.SITE_URL}/opengraph-image`;

  // Build JSON-LD structured schema for rich snippets (Search Console & Google Shopping)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": bookData.book.title,
    "description": bookData.book.synopsis,
    "image": coverUrl,
    "isbn": bookData.book.isbn || undefined,
    "inLanguage": bookData.book.language || "Bengali",
    "numberOfPages": bookData.book.pageCount || undefined,
    "datePublished": bookData.book.publicationDate
      ? new Date(bookData.book.publicationDate).toISOString().split('T')[0]
      : undefined,
    "author": {
      "@type": "Person",
      "name": bookData.book.authorName,
    },
    "offers": {
      "@type": "Offer",
      "price": bookData.book.price,
      "priceCurrency": "INR",
      "availability": bookData.book.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `${env.SITE_URL}/books/${bookData.book.slug}`,
    },
    ...(bookData.book.reviewCount > 0
      ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": bookData.book.averageRating,
            "reviewCount": bookData.book.reviewCount,
            "bestRating": "5",
            "worstRating": "1",
          },
        }
      : {}),
    ...(bookData.reviews.length > 0
      ? {
          "review": bookData.reviews.map((r) => ({
            "@type": "Review",
            "author": {
              "@type": "Person",
              "name": r.reviewerName,
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": r.rating,
              "bestRating": "5",
              "worstRating": "1",
            },
            "reviewBody": r.body,
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailClient
        book={bookData.book}
        relatedBooks={bookData.related}
        isSaved={bookData.isSaved}
        isLoggedIn={!!session}
        reviews={bookData.reviews}
        hasReviewed={bookData.hasReviewed}
      />
    </>
  );
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
