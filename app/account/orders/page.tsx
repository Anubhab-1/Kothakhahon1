import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import {
  getOrderStatusShortLabel,
  getPaymentMethodShortLabel,
  getPaymentStatusShortLabel,
} from "@/lib/orders";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order History",
};

interface AccountOrdersPageProps {
  searchParams: Promise<{ notice?: string; error?: string }>;
}

export default async function AccountOrdersPage({ searchParams }: AccountOrdersPageProps) {
  const [session, params] = await Promise.all([
    requireSession("/account/orders"),
    searchParams,
  ]);

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  const orders = await db.order.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { userId: null, customerEmail: session.email },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs tracking-[0.18em] text-gold">ACCOUNT</p>
          <h1 className="mt-2 font-title text-5xl text-ivory">Order history</h1>
          <p className="mt-3 max-w-3xl font-body text-base text-stone">
            Every order placed with this account or matching email appears here. Click an order for delivery details, tracking, and invoice access.
          </p>
        </div>
        <Link
          href="/account"
          className="fx-button inline-flex rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          BACK TO ACCOUNT
        </Link>
      </div>

      {params.notice && (
        <div className="mt-6 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold">
          {params.notice}
        </div>
      )}

      {params.error && (
        <div className="mt-6 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
          {params.error}
        </div>
      )}

      {orders.length > 0 ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="editorial-panel rounded-[30px] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-gold">
                      {getOrderStatusShortLabel(order.status)}
                    </span>
                    <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-parchment">
                      {getPaymentMethodShortLabel(order.paymentMethod)}
                    </span>
                    <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-parchment">
                      {getPaymentStatusShortLabel(order.paymentStatus)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 min-w-0">
                    <p className="truncate font-mono text-xs text-stone">{order.id}</p>
                    <p className="font-title text-3xl text-ivory">
                      {formatINR(Number(order.totalAmount))}
                    </p>
                    <p className="font-body text-sm text-stone">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item{order.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? "s" : ""} · {formatDisplayDate(
                        order.paymentCollectedAt?.toISOString() ?? order.paidAt?.toISOString() ?? order.createdAt.toISOString(),
                        "Unknown",
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <p className="font-body text-sm text-stone">
                    {order.items.length} title{order.items.length > 1 ? "s" : ""}
                  </p>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="fx-button inline-flex rounded-full border border-smoke bg-obsidian px-4 py-2 font-ui text-[11px] tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                  >
                    VIEW ORDER
                  </Link>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-smoke/15 pt-5 text-sm text-stone">
                {order.items.slice(0, 2).map((item) => (
                  <p key={item.id} className="truncate text-parchment">
                    {item.bookTitle} <span className="font-mono text-xs text-smoke">×{item.quantity}</span>
                  </p>
                ))}
                {order.items.length > 2 && (
                  <p className="text-sm text-smoke">
                    +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-smoke bg-void/70 p-8 text-center">
          <p className="font-ui text-xs tracking-[0.18em] text-gold">NO ORDERS FOUND</p>
          <h2 className="mt-3 font-title text-3xl text-ivory">Your order history is empty</h2>
          <p className="mt-2 max-w-2xl mx-auto font-body text-base text-stone">
            You haven’t placed any orders with this account or email yet. Start exploring the catalog and your next order will show up here.
          </p>
          <Link
            href="/books"
            className="mt-6 inline-flex rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
          >
            BROWSE BOOKS
          </Link>
        </div>
      )}
    </div>
  );
}
