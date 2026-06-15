import Link from "next/link";
import { Star, BadgeCheck, CheckCircle2, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";
import { moderateReviewAction } from "@/app/reviews/actions";

export const metadata = { title: "Admin – Reviews" };

interface AdminReviewsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const { filter } = await searchParams;
  const showPending = filter !== "approved";

  const reviews = await db.review.findMany({
    where: { approved: showPending ? false : true },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const [pendingCount, approvedCount] = await Promise.all([
    db.review.count({ where: { approved: false } }),
    db.review.count({ where: { approved: true } }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Content Moderation"
        title="Reviews"
        description={`${pendingCount} pending · ${approvedCount} approved`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Link
          href="/admin/reviews"
          className={`rounded-full border px-4 py-2 font-ui text-[11px] tracking-[0.14em] transition ${
            showPending
              ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-indigo-400/30 hover:text-indigo-300"
          }`}
        >
          PENDING ({pendingCount})
        </Link>
        <Link
          href="/admin/reviews?filter=approved"
          className={`rounded-full border px-4 py-2 font-ui text-[11px] tracking-[0.14em] transition ${
            !showPending
              ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-indigo-400/30 hover:text-indigo-300"
          }`}
        >
          APPROVED ({approvedCount})
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(99,102,241,0.12)",
            background: "linear-gradient(135deg,#181c27,#1e2233)",
            padding: "2.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#94a3b8", fontFamily: "Georgia, serif" }}>
            {showPending ? "No reviews pending moderation." : "No approved reviews yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              style={{
                borderRadius: "16px",
                border: "1px solid rgba(99,102,241,0.12)",
                background: "linear-gradient(135deg,#181c27,#1e2233)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left — review content */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-none text-slate-600"}`}
                        />
                      ))}
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontFamily: "ui-monospace,monospace" }}>
                      {review.reviewerName}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                      {review.user.email}
                    </span>
                    {review.purchaseVerified && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          borderRadius: "999px",
                          border: "1px solid rgba(52,211,153,0.3)",
                          background: "rgba(52,211,153,0.08)",
                          padding: "2px 8px",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          color: "#6ee7b7",
                        }}
                      >
                        <BadgeCheck className="h-3 w-3" />
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/books/${review.bookSlug}`}
                    target="_blank"
                    style={{ color: "#818cf8", fontSize: "11px", letterSpacing: "0.12em" }}
                  >
                    /books/{review.bookSlug} ↗
                  </Link>

                  {review.title && (
                    <p style={{ color: "#e2e8f0", fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 600 }}>
                      {review.title}
                    </p>
                  )}
                  {review.body && (
                    <p style={{ color: "#94a3b8", fontFamily: "Georgia, serif", fontSize: "14px", lineHeight: 1.7 }}>
                      {review.body}
                    </p>
                  )}

                  <p style={{ color: "#475569", fontSize: "11px" }}>
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>

                {/* Right — actions */}
                <div className="flex shrink-0 gap-2">
                  {showPending && (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button
                        type="submit"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "999px",
                          border: "1px solid rgba(52,211,153,0.4)",
                          background: "rgba(52,211,153,0.1)",
                          padding: "6px 14px",
                          fontSize: "11px",
                          letterSpacing: "0.12em",
                          color: "#6ee7b7",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        APPROVE
                      </button>
                    </form>
                  )}
                  <form action={moderateReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="action" value="reject" />
                    <button
                      type="submit"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "999px",
                        border: "1px solid rgba(239,68,68,0.3)",
                        background: "rgba(239,68,68,0.08)",
                        padding: "6px 14px",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        color: "#fca5a5",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {showPending ? "REJECT" : "DELETE"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
