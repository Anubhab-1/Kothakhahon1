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

interface AdminAuthorsPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminAuthorsPage({ searchParams }: AdminAuthorsPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.AuthorWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const totalCount = await db.author.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const authors = await db.author.findMany({
    where,
    include: {
      _count: {
        select: {
          books: true,
          posts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Authors"
        title="Author Roster"
        description="Maintain bios, images, and awards for writers represented across the site."
        actions={
          <Link href="/admin/authors/new" className="admin-link-button">
            Add Author
          </Link>
        }
      />

      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Roster Search</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Find an author profile</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} MATCHING AUTHORS
          </span>
        </div>

        <form className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, slug, or bio"
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
              <th>Name</th>
              <th>Books</th>
              <th>Journal Posts</th>
              <th>Featured</th>
            </tr>
          </thead>
          <tbody>
            {authors.length > 0 ? (
              authors.map((author) => (
                <tr key={author.id}>
                  <td>
                    <Link href={`/admin/authors/${author.id}`} className="font-medium text-ink transition hover:text-brass">
                      {author.name}
                    </Link>
                    <div className="text-sm text-ink/58">{author.slug}</div>
                  </td>
                  <td>{author._count.books}</td>
                  <td>{author._count.posts}</td>
                  <td>{author.featured ? "Yes" : "No"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No authors match the current search yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/authors", persistedParams, { page })}
      />
    </div>
  );
}
