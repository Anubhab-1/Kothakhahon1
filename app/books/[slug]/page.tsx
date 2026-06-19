import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookDetailClient from "@/components/books/BookDetailClient";
import { db } from "@/lib/db";
import { getAllBooks, getBookBySlug } from "@/lib/content";
import {
  getEffectiveStockStatus,
  normalizeLowStockThreshold,
  normalizeStockQuantity,
} from "@/lib/inventory";
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
    compareAtPrice: book.compareAtPrice,
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
    publisher: book.publisher || undefined,
    galleryImages: book.galleryImages || [],
    tableOfContents: book.tableOfContents || undefined,
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

  const [allBooks, reviews] = await Promise.all([
    getAllBooks(),
    db.review.findMany({
      where: {
        bookId: book._id,
        approved: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        title: true,
        body: true,
        purchaseVerified: true,
        createdAt: true,
      },
    }),
  ]);

  const moreByAuthor = allBooks
    .filter((b) => b.author?._id === book.author?._id && b.slug !== slug)
    .slice(0, 6);

  const currentGenreSlugs = (book.genre ?? []).map((g) => g.slug);
  const youMightAlsoLike = allBooks
    .filter(
      (b) =>
        b.slug !== slug &&
        b.author?._id !== book.author?._id &&
        (b.genre ?? []).some((g) => currentGenreSlugs.includes(g.slug))
    )
    .slice(0, 6);

  return {
    book: mapBookToDetail(book),
    moreByAuthor: moreByAuthor.map(mapRelatedBook),
    youMightAlsoLike: youMightAlsoLike.map(mapRelatedBook),
    reviews: reviews.map((review) => ({
      id: review.id,
      reviewerName: review.reviewerName,
      rating: review.rating,
      title: review.title ?? undefined,
      body: review.body ?? undefined,
      purchaseVerified: review.purchaseVerified,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}

import { env } from "@/lib/env";

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const bookData = await getBookData(slug);

  if (!bookData) {
    notFound();
  }

  // Resolve cover image absolute URL
  const coverUrl = bookData.book.coverImageUrl
    ? (bookData.book.coverImageUrl.startsWith("http")
      ? bookData.book.coverImageUrl
      : `${env.SITE_URL}${bookData.book.coverImageUrl.startsWith("/") ? "" : "/"}${bookData.book.coverImageUrl}`)
    : `${env.SITE_URL}/opengraph-image`;

  const pageUrl = `${env.SITE_URL}/books/${bookData.book.slug}`;
  const aggregateRating =
    bookData.book.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: bookData.book.averageRating,
          reviewCount: bookData.book.reviewCount,
          bestRating: "5",
          worstRating: "1",
        }
      : undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        "@id": `${pageUrl}#book`,
        name: bookData.book.title,
        description: bookData.book.synopsis,
        image: coverUrl,
        isbn: bookData.book.isbn || undefined,
        inLanguage: bookData.book.language || "Bengali",
        numberOfPages: bookData.book.pageCount || undefined,
        datePublished: bookData.book.publicationDate
          ? new Date(bookData.book.publicationDate).toISOString().split("T")[0]
          : undefined,
        author: {
          "@type": "Person",
          name: bookData.book.authorName,
        },
        publisher: {
          "@type": "Organization",
          name: bookData.book.publisher ?? "Kothakhahon Prokashoni",
        },
        aggregateRating,
      },
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: bookData.book.title,
        image: coverUrl,
        description: bookData.book.synopsis,
        sku: bookData.book.isbn || bookData.book.id,
        mpn: bookData.book.isbn || bookData.book.id,
        brand: {
          "@type": "Brand",
          name: "Kothakhahon Prokashoni",
        },
        isRelatedTo: { "@id": `${pageUrl}#book` },
        offers: {
          "@type": "Offer",
          price: bookData.book.price || 0,
          priceCurrency: "INR",
          availability:
            bookData.book.stockQuantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: pageUrl,
          priceValidUntil: "2028-12-31",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "Kothakhahon",
          },
        },
        aggregateRating,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: env.SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Books",
            item: `${env.SITE_URL}/books`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: bookData.book.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BookDetailClient
        book={bookData.book}
        moreByAuthor={bookData.moreByAuthor}
        youMightAlsoLike={bookData.youMightAlsoLike}
        reviews={bookData.reviews}
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

  // Resolve cover image absolute URL
  const coverUrl = data.book.coverImageUrl
    ? (data.book.coverImageUrl.startsWith("http")
      ? data.book.coverImageUrl
      : `${env.SITE_URL}${data.book.coverImageUrl.startsWith("/") ? "" : "/"}${data.book.coverImageUrl}`)
    : `${env.SITE_URL}/opengraph-image`;

  const twitterUrl = data.book.coverImageUrl
    ? (data.book.coverImageUrl.startsWith("http")
      ? data.book.coverImageUrl
      : `${env.SITE_URL}${data.book.coverImageUrl.startsWith("/") ? "" : "/"}${data.book.coverImageUrl}`)
    : `${env.SITE_URL}/twitter-image`;

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
      images: [coverUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: data.book.title,
      description: data.book.synopsis.slice(0, 160),
      images: [twitterUrl],
    },
  };
}
