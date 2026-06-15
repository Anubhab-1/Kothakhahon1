import type { Prisma } from "@/generated/prisma/client";
import AdminNotice from "@/components/admin/AdminNotice";
import ManuscriptStatusForm from "@/components/admin/ManuscriptStatusForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { db } from "@/lib/db";
import {
  buildAdminListHref,
  getPagination,
  normalizeSearchTerm,
  parsePageParam,
} from "@/lib/admin-list";

interface AdminManuscriptsPageProps {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminManuscriptsPage({
  searchParams,
}: AdminManuscriptsPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);
  const status = params.status?.trim() || "all";

  const where: Prisma.ManuscriptSubmissionWhereInput = {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { manuscriptTitle: { contains: q, mode: "insensitive" } },
            { genre: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status !== "all" ? { status } : {}),
  };

  const totalCount = await db.manuscriptSubmission.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const submissions = await db.manuscriptSubmission.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
    status: status !== "all" ? status : undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Manuscripts"
        title="Submission Pipeline"
        description="Review incoming manuscripts, move them through editorial stages, and keep the process visible."
      />
      <AdminNotice notice={params.saved ? "Submission status updated." : undefined} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Pipeline Filters</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Search and narrow submissions</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} MATCHING SUBMISSIONS
          </span>
        </div>

        <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by author, email, title, or genre"
            className="admin-input"
          />
          <input
            type="text"
            name="status"
            defaultValue={status === "all" ? "" : status}
            placeholder="Filter by status"
            className="admin-input"
          />
          <button type="submit" className="admin-button">
            Apply
          </button>
        </form>
      </section>

      <div className="grid gap-4">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <article key={submission.id} className="admin-card">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <p className="admin-eyebrow">{submission.genre}</p>
                  <h2 className="font-title text-3xl text-ink">{submission.manuscriptTitle}</h2>
                  <p className="font-body text-base text-ink/66">
                    {submission.fullName} / {submission.email} / {submission.phone}
                  </p>
                  <p className="font-body text-base text-ink/66">
                    {submission.city} / {submission.language} / {submission.wordCount.toLocaleString("en-IN")} words
                  </p>
                </div>
                <ManuscriptStatusForm submissionId={submission.id} currentStatus={submission.status} />
              </div>
              <p className="mt-5 font-body text-lg leading-relaxed text-ink/72">{submission.synopsis}</p>
            </article>
          ))
        ) : (
          <div className="admin-card">
            <p className="font-body text-lg text-ink/68">No manuscript submissions match the current filters.</p>
          </div>
        )}
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/inbox/manuscripts", persistedParams, { page })}
      />
    </div>
  );
}
