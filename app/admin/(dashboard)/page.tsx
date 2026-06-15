import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import LaunchReadiness from "@/components/admin/LaunchReadiness";
import { bootstrapSeedContentAction } from "@/app/admin/actions";
import { db } from "@/lib/db";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";
import { AlertTriangle, ArrowRight, MessageCircle } from "lucide-react";

interface AdminOverviewPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
}

export default async function AdminOverviewPage({ searchParams }: AdminOverviewPageProps) {
  const [
    params,
    authors,
    books,
    posts,
    orders,
    contactMessages,
    manuscriptSubmissions,
    newsletterSubscribers,
    recentOrders,
    recentMessages,
    failedEmailJobs,
  ] = await Promise.all([
    searchParams,
    db.author.count(),
    db.book.count(),
    db.blogPost.count(),
    db.order.count(),
    db.contactMessage.count(),
    db.manuscriptSubmission.count(),
    db.newsletterSubscriber.count(),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.emailJob.count({
      where: { status: "failed" },
    }),
  ]);

  const hasEditorialContent = authors + books + posts > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <AdminPageHeader
        eyebrow="Overview"
        title="Publishing Control Room"
        description="Monitor catalog health, incoming submissions, and order activity from one internal workspace."
      />

      <AdminNotice notice={params.notice} error={params.error} />

      {/* Failed email jobs banner */}
      {failedEmailJobs > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            borderRadius: "14px",
            border: "1px solid rgba(245,158,11,0.25)",
            background: "rgba(245,158,11,0.08)",
            padding: "0.875rem 1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: "0.875rem", color: "#fcd34d" }}>
              <strong style={{ fontWeight: 700 }}>Warning:</strong>{" "}
              {failedEmailJobs} failed transactional email{failedEmailJobs > 1 ? "s" : ""} in the queue.
            </span>
          </div>
          <Link
            href="/admin/email-jobs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#f59e0b",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 180ms ease",
            }}
          >
            View Queue <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      )}

      <LaunchReadiness />

      {/* Bootstrap catalog */}
      {!hasEditorialContent && (
        <section className="admin-card">
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                display: "inline-block",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "0.4rem",
              }}
            >
              Bootstrap Catalog
            </p>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#f0f2ff",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Import the current curated catalog into the database.
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "600px", lineHeight: 1.6 }}>
              The public site is still using the transitional seed catalog. Import it once and all
              books, authors, posts, and site settings become editable through the admin.
            </p>
          </div>
          <form action={bootstrapSeedContentAction}>
            <AdminSubmitButton idleLabel="Import Current Catalog" pendingLabel="Importing catalog..." />
          </form>
        </section>
      )}

      {/* Stat cards */}
      <section
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        <AdminStatCard label="Books" value={String(books)} hint="Titles in the live catalog database." />
        <AdminStatCard label="Authors" value={String(authors)} hint="Profiles connected to books and essays." />
        <AdminStatCard label="Journal Posts" value={String(posts)} hint="Published essays and editorial updates." />
        <AdminStatCard label="Orders" value={String(orders)} hint="Checkout orders stored for fulfillment." />
      </section>

      {/* Recent activity */}
      <section
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "1.3fr 0.7fr",
        }}
      >
        {/* Recent orders */}
        <article className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "1.5rem 1.75rem",
              borderBottom: "1px solid rgba(99,102,241,0.1)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "0.3rem",
                }}
              >
                Recent Orders
              </p>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#f0f2ff",
                  letterSpacing: "-0.015em",
                }}
              >
                Latest commerce activity
              </h2>
            </div>
            <Link href="/admin/orders" className="admin-link-button" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
              View all
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Workflow</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          style={{
                            fontWeight: 600,
                            color: "#a5b4fc",
                            textDecoration: "none",
                            transition: "color 180ms ease",
                          }}
                        >
                          {order.customerName}
                        </Link>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                          {order.customerEmail}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "1px" }}>
                          {getPaymentMethodLabel(order.paymentMethod)} /{" "}
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </div>
                      </td>
                      <td>
                        <span className="admin-status-pill">
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#f0f2ff", fontVariantNumeric: "tabular-nums" }}>
                        ₹ {order.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                        {order.createdAt.toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        color: "#475569",
                        fontSize: "0.875rem",
                        padding: "2.5rem",
                      }}
                    >
                      Orders will appear here once checkout is live.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Pulse metrics */}
          <div className="admin-card">
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "0.5rem",
              }}
            >
              Submissions & Inbox
            </p>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#f0f2ff",
                marginBottom: "1rem",
                letterSpacing: "-0.015em",
              }}
            >
              Operational pulse
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {[
                { label: "Contact Messages", value: contactMessages, color: "#6366f1" },
                { label: "Manuscripts", value: manuscriptSubmissions, color: "#8b5cf6" },
                { label: "Newsletter", value: newsletterSubscribers, color: "#22d3ee" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>{label}</span>
                  <span
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent messages */}
          <div className="admin-card" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "0.25rem",
                  }}
                >
                  Latest Messages
                </p>
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#f0f2ff",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Reader inbox
                </h2>
              </div>
              <Link
                href="/admin/inbox/contact"
                className="admin-link-button"
                style={{ fontSize: "0.75rem", padding: "0.4rem 0.85rem" }}
              >
                Open
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      borderRadius: "12px",
                      border: "1px solid rgba(99,102,241,0.1)",
                      background: "rgba(99,102,241,0.04)",
                      padding: "0.875rem 1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#6366f1",
                          }}
                        >
                          {message.department}
                        </p>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f0f2ff", marginTop: "1px" }}>
                          {message.fullName}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{message.email}</p>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "#475569", flexShrink: 0 }}>
                        {message.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {message.message}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "2rem",
                    textAlign: "center",
                  }}
                >
                  <MessageCircle style={{ width: 28, height: 28, color: "#3d4460" }} />
                  <p style={{ fontSize: "0.825rem", color: "#475569" }}>
                    Contact messages will appear when readers write in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
