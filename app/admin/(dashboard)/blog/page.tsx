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

interface AdminBlogPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.BlogPostWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { author: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const totalCount = await db.blogPost.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const posts = await db.blogPost.findMany({
    where,
    include: {
      author: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Journal"
        title="Editorial Journal"
        description="Control category, excerpts, body copy, and author attribution for the public journal."
        actions={
          <Link href="/admin/blog/new" className="admin-link-button">
            Add Journal Post
          </Link>
        }
      />

      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Journal Search</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Find a post draft or essay</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} MATCHING POSTS
          </span>
        </div>

        <form className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title, slug, category, or author"
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
              <th>Category</th>
              <th>Author</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/blog/${post.id}`} className="font-medium text-ink transition hover:text-brass">
                      {post.title}
                    </Link>
                    <div className="text-sm text-ink/58">{post.slug}</div>
                  </td>
                  <td>{post.category ?? "Journal"}</td>
                  <td>{post.author?.name ?? "Unassigned"}</td>
                  <td>{post.publishedAt ?? "Draft"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No journal posts match the current search yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/blog", persistedParams, { page })}
      />
    </div>
  );
}
