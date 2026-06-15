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

interface AdminContactInboxPageProps {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminContactInboxPage({
  searchParams,
}: AdminContactInboxPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.ContactMessageWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const totalCount = await db.contactMessage.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const messages = await db.contactMessage.findMany({
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
        eyebrow="Contact Inbox"
        title="Reader And Partner Messages"
        description="A clean inbox for editorial, rights, and general site contact without relying on external spreadsheets."
      />
      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Inbox Search</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Find a message quickly</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} MATCHING MESSAGES
          </span>
        </div>

        <form className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by sender, email, department, or message"
            className="admin-input min-w-[18rem] flex-1"
          />
          <button type="submit" className="admin-button">
            Search
          </button>
        </form>
      </section>

      <div className="grid gap-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <article key={message.id} className="admin-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="admin-eyebrow">{message.department}</p>
                  <h2 className="mt-2 font-title text-3xl text-ink">{message.fullName}</h2>
                  <p className="font-body text-base text-ink/62">{message.email}</p>
                </div>
                <p className="font-body text-sm text-ink/56">{message.createdAt.toLocaleString("en-IN")}</p>
              </div>
              <p className="mt-5 font-body text-lg leading-relaxed text-ink/72">{message.message}</p>
            </article>
          ))
        ) : (
          <div className="admin-card">
            <p className="font-body text-lg text-ink/68">No contact messages match the current search.</p>
          </div>
        )}
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/inbox/contact", persistedParams, { page })}
      />
    </div>
  );
}
