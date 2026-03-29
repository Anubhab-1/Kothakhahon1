import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";
import { formatINR } from "@/lib/utils";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    order?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Order Received",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order: orderId } = await searchParams;
  if (!orderId) {
    redirect("/checkout");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      totalAmount: true,
      paidAt: true,
      paymentCollectedAt: true,
      customerEmail: true,
      createdAt: true,
    },
  });

  if (
    !order ||
    order.status === "cancelled" ||
    order.paymentStatus === "failed" ||
    (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid")
  ) {
    redirect(`/checkout/failed?order=${encodeURIComponent(orderId)}`);
  }

  const isCashOnDelivery = order.paymentMethod === "cod";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center md:px-8">
      <div className="editorial-panel w-full rounded-2xl p-8 md:p-10">
        <p className="font-ui text-xs tracking-[0.16em] text-gold">
          {isCashOnDelivery ? "ORDER RECEIVED" : "PAYMENT SUCCESS"}
        </p>
        <h1 className="mt-3 font-title text-5xl text-ivory">
          {isCashOnDelivery ? "Cash On Delivery Reserved" : "Order Confirmed"}
        </h1>
        <p className="mt-4 font-body text-lg text-stone">
          {isCashOnDelivery
            ? "Your order is confirmed for cash on delivery. We may contact you before dispatch to reconfirm the shipment."
            : "Your payment has been received and the order is now queued for packing and dispatch."}
        </p>
        <div className="mt-4 ink-divider" />
        <div className="mt-6 rounded-xl border border-smoke bg-obsidian p-5 text-left">
          <p className="font-ui text-xs tracking-[0.12em] text-stone">ORDER ID</p>
          <p className="mt-1 font-mono text-xs text-parchment">{order.id}</p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">PAYMENT METHOD</p>
          <p className="mt-1 font-body text-sm text-parchment">
            {getPaymentMethodLabel(order.paymentMethod)}
          </p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">STATUS</p>
          <p className="mt-1 font-body text-sm text-parchment">{getOrderStatusLabel(order.status)}</p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">PAYMENT STATE</p>
          <p className="mt-1 font-body text-sm text-parchment">
            {getPaymentStatusLabel(order.paymentStatus)}
          </p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">EMAIL</p>
          <p className="mt-1 font-body text-sm text-parchment">{order.customerEmail}</p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">
            {isCashOnDelivery ? "PLACED ON" : "PAID ON"}
          </p>
          <p className="mt-1 font-body text-sm text-parchment">
            {formatDisplayDate(
              order.paymentCollectedAt?.toISOString() ??
                order.paidAt?.toISOString() ??
                order.createdAt.toISOString(),
              "Unknown",
            )}
          </p>
          <p className="mt-3 font-ui text-xs tracking-[0.12em] text-stone">
            {isCashOnDelivery ? "AMOUNT DUE" : "AMOUNT"}
          </p>
          <p className="mt-1 font-title text-3xl text-ivory">{formatINR(Number(order.totalAmount))}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/books"
            className="fx-button rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            RETURN TO CATALOG
          </Link>
          <Link
            href="/contact"
            className="fx-button rounded-full border border-smoke bg-obsidian px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold"
          >
            CONTACT THE DESK
          </Link>
        </div>
      </div>
    </div>
  );
}
