import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";
import { formatINR } from "@/lib/utils";

interface AccountOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: AccountOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Order ${id.slice(-8).toUpperCase()}`,
  };
}

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const [session, { id }] = await Promise.all([requireSession("/account"), params]);

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  const order = await db.order.findFirst({
    where: {
      id,
      OR: [
        {
          userId: session.userId,
        },
        {
          userId: null,
          customerEmail: session.email,
        },
      ],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="grain-overlay mx-auto w-full max-w-5xl px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-xs tracking-[0.16em] text-gold">ORDER DETAIL</p>
          <h1 className="mt-2 text-safe font-title text-5xl text-ivory">
            Order {order.id.slice(-8).toUpperCase()}
          </h1>
        </div>
        <Link
          href="/account"
          className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          BACK TO ACCOUNT
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
        <section className="editorial-panel rounded-[30px] p-6 md:p-8">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">ITEM SNAPSHOT</p>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-smoke bg-void/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-title text-3xl text-ivory">{item.bookTitle}</p>
                    <p className="font-body text-sm text-stone">{item.bookAuthor}</p>
                  </div>
                  <p className="font-ui text-[11px] tracking-[0.14em] text-gold">QTY {item.quantity}</p>
                </div>
                <p className="mt-3 font-body text-sm text-stone">
                  Unit price {formatINR(item.price)} / Line total {formatINR(item.price * item.quantity)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="editorial-panel rounded-[30px] p-6 md:p-8">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">STATUS</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-gold">
                {getOrderStatusLabel(order.status).toUpperCase()}
              </span>
              <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-parchment">
                {getPaymentStatusLabel(order.paymentStatus).toUpperCase()}
              </span>
              <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[11px] tracking-[0.14em] text-parchment">
                {getPaymentMethodLabel(order.paymentMethod).toUpperCase()}
              </span>
            </div>
            <div className="mt-5 space-y-3 font-body text-base text-stone">
              <p>Placed on {formatDisplayDate(order.createdAt.toISOString(), "Unknown")}</p>
              <p>
                Latest payment activity{" "}
                {formatDisplayDate(
                  order.paymentCollectedAt?.toISOString() ??
                    order.paidAt?.toISOString() ??
                    order.createdAt.toISOString(),
                  "Unknown",
                )}
              </p>
              <p className="text-parchment">Total {formatINR(Number(order.totalAmount))}</p>
            </div>
          </div>

          <div className="editorial-panel rounded-[30px] p-6 md:p-8">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">DELIVERY ADDRESS</p>
            <div className="mt-5 space-y-2 font-body text-base leading-relaxed text-parchment">
              <p>{order.customerName}</p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
              <p>
                {order.city}, {order.state} {order.postalCode}
              </p>
              <p>{order.country}</p>
              <p className="pt-2 text-stone">{order.customerEmail}</p>
              <p className="text-stone">{order.customerPhone}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
