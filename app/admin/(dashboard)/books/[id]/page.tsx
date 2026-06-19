import { notFound } from "next/navigation";
import BookEditor from "@/components/admin/BookEditor";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";

interface AdminBookDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
}

export default async function AdminBookDetailPage({
  params,
  searchParams,
}: AdminBookDetailPageProps) {
  const [{ id }, search, authors, book] = await Promise.all([
    params,
    searchParams,
    db.author.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    params.then(({ id: bookId }) =>
      db.book.findUnique({
        where: { id: bookId },
        include: {
          genres: {
            include: {
              genre: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
      }),
    ),
  ]);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Books"
        title={`Edit ${book.title}`}
        description="Adjust storefront copy, metadata, pricing, and featured placement."
      />
      <AdminNotice notice={search.saved ? "Book saved." : undefined} error={search.error} />
      <BookEditor
        authors={authors.map((author) => ({ id: author.id, name: author.name }))}
        book={{
          id,
          title: book.title,
          titleEn: book.titleEn ?? "",
          slug: book.slug,
          authorId: book.authorId ?? "",
          coverImageUrl: book.coverImageUrl ?? "",
          synopsis: book.synopsis ?? "",
          pullQuote: book.pullQuote ?? "",
          price: book.price?.toString() ?? "",
          stockQuantity: String(book.stockQuantity),
          lowStockThreshold: String(book.lowStockThreshold),
          buyLink: book.buyLink ?? "",
          publicationDate: book.publicationDate ?? "",
          pageCount: book.pageCount?.toString() ?? "",
          isbn: book.isbn ?? "",
          language: book.language ?? "",
          featured: book.featured,
          chapterPreview: book.chapterPreview ?? "",
          averageRating: book.averageRating?.toString() ?? "",
          reviewCount: String(book.reviewCount ?? 0),
          genres: book.genres.map((item) => item.genre.name),
          publisher: book.publisher ?? "",
          compareAtPrice: book.compareAtPrice?.toString() ?? "",
          galleryImages: book.galleryImages,
          tableOfContents: book.tableOfContents ?? "",
        }}
      />
    </div>
  );
}
