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

interface AdminOverviewPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
}

export default async function AdminOverviewPage({ searchParams }: AdminOverviewPageProps) {
  const [params, authors, books, posts, orders, contactMessages, manuscriptSubmissions, newsletterSubscribers, recentOrders, recentMessages] =
    await Promise.all([
      searchParams,
      db.author.count(),
      db.book.count(),
      db.blogPost.count(),
      db.order.count(),
      db.contactMessage.count(),
      db.manuscriptSubmission.count(),
      db.newsletterSubscriber.count(),
      db.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      db.contactMessage.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

  const hasEditorialContent = authors + books + posts > 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Overview"
        title="Publishing Control Room"
        description="Monitor catalog health, incoming submissions, and order activity from one internal workspace."
      />

      <AdminNotice notice={params.notice} error={params.error} />

      <LaunchReadiness />

      {!hasEditorialContent ? (
        <section className="admin-card space-y-5">
          <div className="space-y-2">
            <p className="admin-eyebrow">Bootstrap Catalog</p>
            <h2 className="font-title text-4xl text-ink">Import the current curated catalog into the database.</h2>
            <p className="max-w-3xl font-body text-lg text-ink/70">
              The public site is still using the transitional seed catalog. Import it once here and all books, authors, posts, and site settings become editable through the admin.
            </p>
          </div>
          <form action={bootstrapSeedContentAction}>
            <AdminSubmitButton idleLabel="Import Current Catalog" pendingLabel="Importing catalog..." />
          </form>
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Books" value={String(books)} hint="Titles currently available in the live catalog database." />
        <AdminStatCard label="Authors" value={String(authors)} hint="Profiles connected to books, essays, and editorial voice." />
        <AdminStatCard label="Journal Posts" value={String(posts)} hint="Published essays, notes, and editorial updates." />
        <AdminStatCard label="Orders" value={String(orders)} hint="Guest checkout orders stored for fulfillment tracking." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="admin-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="admin-eyebrow">Recent Orders</p>
              <h2 className="mt-2 font-title text-4xl text-ink">Latest commerce activity</h2>
            </div>
            <Link href="/admin/orders" className="admin-link-button">
              View all orders
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-ink/10">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Workflow</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink transition hover:text-brass">
                          {order.customerName}
                        </Link>
                        <div className="text-sm text-ink/58">{order.customerEmail}</div>
                        <div className="text-xs text-ink/46">
                          {getPaymentMethodLabel(order.paymentMethod)} / {getPaymentStatusLabel(order.paymentStatus)}
                        </div>
                      </td>
                      <td>
                        <span className="admin-status-pill">{getOrderStatusLabel(order.status)}</span>
                      </td>
                      <td>Rs. {order.totalAmount.toFixed(2)}</td>
                      <td>{order.createdAt.toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Orders will appear here after checkout starts receiving live orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="space-y-6">
          <div className="admin-card">
            <p className="admin-eyebrow">Submissions & Inbox</p>
            <h2 className="mt-2 font-title text-4xl text-ink">Operational pulse</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[20px] border border-ink/10 bg-white/72 px-5 py-4">
                <p className="font-ui text-[11px] tracking-[0.16em] text-brass">CONTACT</p>
                <p className="mt-2 font-title text-4xl text-ink">{contactMessages}</p>
              </div>
              <div className="rounded-[20px] border border-ink/10 bg-white/72 px-5 py-4">
                <p className="font-ui text-[11px] tracking-[0.16em] text-brass">MANUSCRIPTS</p>
                <p className="mt-2 font-title text-4xl text-ink">{manuscriptSubmissions}</p>
              </div>
              <div className="rounded-[20px] border border-ink/10 bg-white/72 px-5 py-4">
                <p className="font-ui text-[11px] tracking-[0.16em] text-brass">NEWSLETTER</p>
                <p className="mt-2 font-title text-4xl text-ink">{newsletterSubscribers}</p>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="admin-eyebrow">Latest Contact Messages</p>
                <h2 className="mt-2 font-title text-4xl text-ink">Reader inbox</h2>
              </div>
              <Link href="/admin/inbox/contact" className="admin-link-button">
                Open inbox
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <div key={message.id} className="rounded-[20px] border border-ink/10 bg-white/70 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-ui text-[11px] tracking-[0.15em] text-brass">{message.department.toUpperCase()}</p>
                        <p className="mt-1 font-title text-2xl text-ink">{message.fullName}</p>
                        <p className="font-body text-sm text-ink/58">{message.email}</p>
                      </div>
                      <p className="text-sm text-ink/54">{message.createdAt.toLocaleDateString("en-IN")}</p>
                    </div>
                    <p className="mt-3 line-clamp-3 font-body text-base leading-relaxed text-ink/72">{message.message}</p>
                  </div>
                ))
              ) : (
                <p className="font-body text-base text-ink/62">Contact messages will appear here when readers start writing in.</p>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
