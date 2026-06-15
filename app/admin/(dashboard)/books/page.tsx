import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { db } from "@/lib/db";
import {
  buildAdminListHref,
  getPagination,
  normalizeSearchTerm,
  parsePageParam,
} from "@/lib/admin-list";

interface AdminBooksPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.BookWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { author: { name: { contains: q, mode: "insensitive" } } },
          { genres: { some: { genre: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      }
    : {};

  const totalCount = await db.book.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const books = await db.book.findMany({
    where,
    include: {
      author: true,
      genres: {
        include: {
          genre: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: [{ publicationDate: "desc" }, { updatedAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Books"
        title="Catalog Library"
        description="Edit the live book list, featured titles, chapter previews, and metadata used by checkout."
        actions={
          <Link href="/admin/books/new" className="admin-link-button">
            Add New Book
          </Link>
        }
      />

      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Catalog Search</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Find a book fast</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} MATCHING TITLES
          </span>
        </div>

        <form className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title, slug, author, or genre"
            className="admin-input min-w-[18rem] flex-1"
          />
          <button type="submit" className="admin-button">
            Search
          </button>
        </form>
      </section>

      <div style={{ overflow:"hidden", borderRadius:"20px", border:"1px solid rgba(99,102,241,0.12)", background:"linear-gradient(135deg,#181c27,#1e2233)", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genres</th>
              <th>Price</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {books.length > 0 ? (
              books.map((book) => (
                <tr key={book.id}>
                  <td>
                    <Link href={`/admin/books/${book.id}`} className="font-medium text-ink transition hover:text-brass">
                      {book.title}
                    </Link>
                    <div className="text-sm text-ink/58">{book.slug}</div>
                  </td>
                  <td>{book.author?.name ?? "Unassigned"}</td>
                  <td>{book.genres.map((item) => item.genre.name).join(", ") || "No genres"}</td>
                  <td>{typeof book.price === "number" ? `Rs. ${book.price.toFixed(2)}` : "Not set"}</td>
                  <td>{book.publicationDate ?? "Not set"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No books match the current search yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/books", persistedParams, { page })}
      />
    </div>
  );
}
