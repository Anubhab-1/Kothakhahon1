import type { Prisma } from "@/generated/prisma/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { db } from "@/lib/db";
import {
  buildAdminListHref,
  getPagination,
  normalizeSearchTerm,
  parsePageParam,
} from "@/lib/admin-list";

interface AdminNewsletterPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function AdminNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.NewsletterSubscriberWhereInput = {
    isActive: true,
    ...(q ? { email: { contains: q, mode: "insensitive" } } : {}),
  };

  const totalCount = await db.newsletterSubscriber.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const subscribers = await db.newsletterSubscriber.findMany({
    where,
    orderBy: {
      createdAt: "desc",
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
        eyebrow="Newsletter"
        title="Subscriber List"
        description="A simple export-friendly list for launch-stage email collection."
      />

      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Subscriber Search</p>
            <h2 className="mt-2 font-title text-4xl text-ink">{totalCount}</h2>
          </div>
          <form className="flex flex-wrap gap-3">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search subscriber email"
              className="admin-input min-w-[18rem]"
            />
            <button type="submit" className="admin-button">
              Search
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-ink/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length > 0 ? (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>{subscriber.email}</td>
                    <td>{subscriber.createdAt.toLocaleDateString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2}>No subscribers match the current search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/newsletter", persistedParams, { page })}
      />
    </div>
  );
}
