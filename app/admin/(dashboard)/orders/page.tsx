import Link from "next/link";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@/generated/prisma/client";
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
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    q?: string;
    status?: string;
    payment?: string;
    method?: string;
    page?: string;
    sort?: string;
    dateRange?: string;
  }>;
}

const orderStatuses: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const paymentStatuses: Array<PaymentStatus | "all"> = ["all", "pending", "paid", "failed", "refunded"];
const paymentMethods: Array<PaymentMethod | "all"> = ["all", "cod", "razorpay"];

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);
  const status =
    orderStatuses.includes((params.status as OrderStatus | "all") ?? "all")
      ? ((params.status as OrderStatus | "all") ?? "all")
      : "all";
  const payment =
    paymentStatuses.includes((params.payment as PaymentStatus | "all") ?? "all")
      ? ((params.payment as PaymentStatus | "all") ?? "all")
      : "all";
  const method =
    paymentMethods.includes((params.method as PaymentMethod | "all") ?? "all")
      ? ((params.method as PaymentMethod | "all") ?? "all")
      : "all";
  const sort =
    params.sort && ["newest", "oldest", "amount_asc", "amount_desc"].includes(params.sort)
      ? params.sort
      : "newest";
  const dateRange =
    params.dateRange && ["all", "today", "yesterday", "this_week", "this_month"].includes(params.dateRange)
      ? params.dateRange
      : "all";

  let dateFilter: Prisma.DateTimeFilter | undefined;
  const now = new Date();

  if (dateRange === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    dateFilter = { gte: start };
  } else if (dateRange === "yesterday") {
    const start = new Date(now);
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (dateRange === "this_week") {
    const start = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    dateFilter = { gte: start };
  } else if (dateRange === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { gte: start };
  }

  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status !== "all" ? { status } : {}),
    ...(payment !== "all" ? { paymentStatus: payment } : {}),
    ...(method !== "all" ? { paymentMethod: method } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "amount_asc") {
    orderBy = { totalAmount: "asc" };
  } else if (sort === "amount_desc") {
    orderBy = { totalAmount: "desc" };
  }

  const totalCount = await db.order.count({ where });
  const pagination = getPagination(totalCount, requestedPage);
  const orders = await db.order.findMany({
    where,
    include: {
      items: true,
    },
    orderBy,
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
    status: status !== "all" ? status : undefined,
    payment: payment !== "all" ? payment : undefined,
    method: method !== "all" ? method : undefined,
    sort: sort !== "newest" ? sort : undefined,
    dateRange: dateRange !== "all" ? dateRange : undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Orders"
        title="Order Ledger"
        description="Track guest and account-linked orders, payment collection, and fulfillment without leaving the admin workspace."
      />
      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Filters</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Search the order ledger</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} matching orders
          </span>
        </div>

        <form className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.7fr))_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by customer, email, or order ID"
            className="admin-input"
          />
          <select name="status" className="admin-select" defaultValue={status}>
            {orderStatuses.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All fulfillment states" : getOrderStatusLabel(value)}
              </option>
            ))}
          </select>
          <select name="payment" className="admin-select" defaultValue={payment}>
            {paymentStatuses.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All payment states" : getPaymentStatusLabel(value)}
              </option>
            ))}
          </select>
          <select name="method" className="admin-select" defaultValue={method}>
            {paymentMethods.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All methods" : getPaymentMethodLabel(value)}
              </option>
            ))}
          </select>
          <select name="dateRange" className="admin-select" defaultValue={dateRange}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          <select name="sort" className="admin-select" defaultValue={sort}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_asc">Amount (Low to High)</option>
            <option value="amount_desc">Amount (High to Low)</option>
          </select>
          <button type="submit" className="admin-button">
            Apply
          </button>
        </form>
      </section>

      <div style={{ overflow:"hidden", borderRadius:"20px", border:"1px solid rgba(99,102,241,0.12)", background:"linear-gradient(135deg,#181c27,#1e2233)", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Method</th>
              <th>Fulfillment</th>
              <th>Payment</th>
              <th>Items</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} style={{ fontWeight:600, color:"#a5b4fc", textDecoration:"none", transition:"color 180ms ease" }}>
                      {order.customerName}
                    </Link>
                    <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"2px" }}>{order.customerEmail}</div>
                    <div style={{ fontSize:"0.7rem", color:"#475569", marginTop:"1px" }}>{order.id}</div>
                  </td>
                  <td>{getPaymentMethodLabel(order.paymentMethod)}</td>
                  <td>
                    <span className="admin-status-pill">{getOrderStatusLabel(order.status)}</span>
                  </td>
                  <td>
                    <span className="admin-status-pill">{getPaymentStatusLabel(order.paymentStatus)}</span>
                  </td>
                  <td>{order.items.length}</td>
                  <td style={{ fontWeight:600, fontVariantNumeric:"tabular-nums" }}>₹ {order.totalAmount.toFixed(2)}</td>
                  <td>{order.createdAt.toLocaleDateString("en-IN")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No orders match the current filters yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/orders", persistedParams, { page })}
      />
    </div>
  );
}
