import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { ConfettiBurst } from "@/components/ui/ConfettiBurst";

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
      subtotalAmount: true,
      shippingAmount: true,
      discountAmount: true,
      couponCode: true,
      totalAmount: true,
      paidAt: true,
      paymentCollectedAt: true,
      customerEmail: true,
      createdAt: true,
      shippingMethod: true,
      items: {
        select: {
          id: true,
          bookTitle: true,
          quantity: true,
          price: true,
        },
      },
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
      <ConfettiBurst />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">ORDER ID</p>
              <p className="mt-1 font-mono text-xs text-parchment truncate">{order.id}</p>
            </div>
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">EMAIL</p>
              <p className="mt-1 font-body text-sm text-parchment truncate">{order.customerEmail}</p>
            </div>
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">PAYMENT METHOD</p>
              <p className="mt-1 font-body text-sm text-parchment">
                {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">PAYMENT STATE</p>
              <p className="mt-1 font-body text-sm text-parchment">
                {getPaymentStatusLabel(order.paymentStatus)}
              </p>
            </div>
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">SHIPPING METHOD</p>
              <p className="mt-1 font-body text-sm text-parchment capitalize">
                {order.shippingMethod} Shipping
              </p>
            </div>
            <div>
              <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">DELIVERY ESTIMATE</p>
              <p className="mt-1 font-body text-sm text-gold font-medium">
                {order.shippingMethod === "express" ? "2-3 business days" : "5-7 business days"}
              </p>
            </div>
          </div>

          <div className="my-4 border-t border-smoke/30" />

          <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">ITEMS</p>
          <div className="mt-2 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-body text-parchment line-clamp-1 pr-4">
                  {item.bookTitle} <span className="text-stone">× {item.quantity}</span>
                </span>
                <span className="font-mono text-stone">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-smoke/30" />

          <div className="space-y-2 text-sm text-stone">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-mono text-parchment">{formatINR(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Shipping Fee</span>
              <span className="font-mono text-parchment">{formatINR(order.shippingAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-400">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span className="font-mono">-{formatINR(order.discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="my-4 border-t border-smoke/30" />

          <div className="flex items-center justify-between">
            <p className="font-ui text-[10px] tracking-[0.12em] text-stone uppercase">
              {isCashOnDelivery ? "AMOUNT DUE" : "AMOUNT PAID"}
            </p>
            <p className="font-title text-2xl text-ivory">{formatINR(Number(order.totalAmount))}</p>
          </div>
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
