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
import { formatINR, cn } from "@/lib/utils";

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

  function getTrackingUrl(carrierName?: string | null, trackingNo?: string | null) {
    if (!carrierName || !trackingNo) return null;
    const cleanCarrier = carrierName.toLowerCase().trim();
    const cleanNumber = trackingNo.trim();
    if (cleanCarrier === "delhivery") {
      return `https://www.delhivery.com/track/package/${cleanNumber}`;
    }
    if (cleanCarrier === "india-post" || cleanCarrier === "india post") {
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }
    if (cleanCarrier === "dhl") {
      return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanNumber}`;
    }
    if (cleanCarrier === "fedex") {
      return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${cleanNumber}`;
    }
    return null;
  }

  const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);

  const isConfirmed =
    order.paymentMethod === "cod"
      ? order.status !== "pending" || Boolean(order.processingAt)
      : order.paymentStatus === "paid";
  const isProcessing = Boolean(order.processingAt || ["processing", "packed", "shipped", "delivered"].includes(order.status));
  const isPacked = Boolean(order.packedAt || ["packed", "shipped", "delivered"].includes(order.status));
  const isShipped = Boolean(order.shippedAt || ["shipped", "delivered"].includes(order.status));
  const isDelivered = Boolean(order.deliveredAt || order.status === "delivered");
  const isCancelled = order.status === "cancelled";
  const isRefunded = order.status === "refunded";

  const timeline = [
    {
      label: "Order placed",
      date: order.createdAt,
      active: true,
      desc: "Your order has been accepted and entered into our system.",
    },
    {
      label: order.paymentMethod === "cod" ? "Order confirmed" : "Payment received",
      date: order.processingAt ?? order.paidAt ?? (isConfirmed ? order.createdAt : null),
      active: isConfirmed,
      desc: order.paymentMethod === "cod"
        ? "Cash-on-delivery orders are confirmed and queued for fulfilment."
        : "Your payment has been authorized and verified.",
    },
    {
      label: "Processing",
      date: order.processingAt,
      active: isProcessing,
      desc: "We are preparing your books and packing them for shipment.",
    },
    { label: "Packed", date: order.packedAt, active: isPacked, desc: "Your parcel is packed and ready for pickup." },
    { label: "Shipped", date: order.shippedAt, active: isShipped, desc: "The carrier has picked up your package." },
    { label: "Delivered", date: order.deliveredAt, active: isDelivered, desc: "The package has been delivered to the address provided." },
  ];

  if (isCancelled || isRefunded) {
    timeline.push({
      label: isCancelled ? "Order cancelled" : "Order refunded",
      date: order.cancelledAt ?? order.refundedAt ?? order.updatedAt,
      active: true,
      desc: isCancelled
        ? "This order was cancelled and will not be fulfilled."
        : "The payment was refunded to your original method.",
    });
  }

  const statusSummary = isCancelled
    ? `This order was cancelled on ${formatDisplayDate(order.cancelledAt?.toISOString() ?? order.updatedAt.toISOString(), "recent date")}.`
    : isRefunded
    ? `This order was refunded on ${formatDisplayDate(order.refundedAt?.toISOString() ?? order.updatedAt.toISOString(), "recent date")}.`
    : isDelivered
    ? `Delivered on ${formatDisplayDate(order.deliveredAt!.toISOString(), "recent date")}.`
    : isShipped
    ? `Shipped on ${formatDisplayDate(order.shippedAt!.toISOString(), "recent date")}. Track your delivery with the carrier link below.`
    : isPacked
    ? "Packed and awaiting carrier pickup."
    : isProcessing
    ? "Preparing your order at our fulfilment desk."
    : order.paymentStatus === "pending"
    ? "Awaiting payment confirmation."
    : "Your order is in progress and will update here soon.";

  return (
    <div className="grain-overlay mx-auto w-full max-w-5xl px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-xs tracking-[0.16em] text-gold">ORDER DETAIL</p>
          <h1 className="mt-2 text-safe font-title text-5xl text-ivory">
            Order {order.id.slice(-8).toUpperCase()}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/api/orders/${order.id}/invoice`}
            className="fx-button rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
          >
            DOWNLOAD INVOICE
          </Link>
          <Link
            href="/account"
            className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
          >
            BACK TO ACCOUNT
          </Link>
        </div>
      </div>

      {/* Cancelled or Refunded Notice */}
      {(order.status === "cancelled" || order.status === "refunded") && (
        <div className="mt-6 rounded-2xl border border-ember/35 bg-ember/10 p-4 font-body text-base text-ember">
          This order was <strong>{order.status.toUpperCase()}</strong> on{" "}
          {formatDisplayDate(order.cancelledAt?.toISOString() ?? order.refundedAt?.toISOString() ?? order.updatedAt.toISOString(), "recent date")}.
        </div>
      )}

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
            <p className="font-ui text-xs tracking-[0.16em] text-gold">ORDER STATUS & TRACKING</p>
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

            <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm text-parchment">
              <p className="font-ui text-[10px] tracking-[0.14em] text-gold">CURRENT DELIVERY SUMMARY</p>
              <p className="mt-2 font-body text-base text-ivory">{statusSummary}</p>
            </div>

            {/* Carrier tracking details */}
            {order.trackingNumber && (
              <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4 space-y-2">
                <p className="font-ui text-[10px] tracking-[0.14em] text-gold">DELIVERY TRACKING</p>
                <p className="font-body text-base text-parchment">
                  Carrier: <strong className="text-ivory">{order.carrier?.toUpperCase()}</strong>
                </p>
                <p className="font-body text-base text-parchment">
                  Tracking Number: <strong className="text-ivory">{order.trackingNumber}</strong>
                </p>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-full border border-gold bg-gold px-4 py-2 font-ui text-xs font-semibold tracking-wider text-void transition hover:bg-gold-dim"
                  >
                    TRACK PACKAGE
                  </a>
                ) : (
                  <p className="font-body text-xs text-stone">
                    Please track directly on the carrier&apos;s portal using the tracking number above.
                  </p>
                )}
              </div>
            )}

            {/* Visual Timeline */}
            <div className="mt-8 space-y-0">
              {timeline.map((stepItem, index) => {
                const isLast = index === timeline.length - 1;
                const nextActive = !isLast && timeline[index + 1]?.active;
                return (
                  <div key={index} className="flex gap-4">
                    {/* Connector column */}
                    <div className="flex flex-col items-center">
                      {/* Dot */}
                      <div
                        className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                          stepItem.active
                            ? "border-gold bg-gold/10 shadow-[0_0_12px_2px_rgba(212,175,55,0.25)]"
                            : "border-smoke/50 bg-void"
                        )}
                      >
                        {stepItem.active ? (
                          <span className="block h-2.5 w-2.5 rounded-full bg-gold" />
                        ) : (
                          <span className="block h-2 w-2 rounded-full bg-smoke/40" />
                        )}
                      </div>
                      {/* Vertical line */}
                      {!isLast && (
                        <div
                          className={cn(
                            "w-px flex-1 my-1 min-h-[28px] transition-all duration-300",
                            nextActive ? "bg-gold/50" : "bg-smoke/40"
                          )}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className={cn("pb-6 pt-1", isLast && "pb-0")}>
                      <p
                        className={cn(
                          "font-ui text-[10px] tracking-[0.16em] uppercase transition-colors",
                          stepItem.active ? "text-gold" : "text-stone/50"
                        )}
                      >
                        {stepItem.active && stepItem.date
                          ? formatDisplayDate(
                              typeof stepItem.date === "string"
                                ? stepItem.date
                                : stepItem.date.toISOString(),
                              ""
                            )
                          : "Pending"}
                      </p>
                      <h4
                        className={cn(
                          "mt-0.5 font-title text-xl leading-snug transition-colors",
                          stepItem.active ? "text-ivory" : "text-stone/60"
                        )}
                      >
                        {stepItem.label}
                      </h4>
                      <p className={cn("mt-0.5 font-body text-sm", stepItem.active ? "text-stone" : "text-stone/40")}>
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-smoke/70 pt-6 space-y-2.5 font-body text-sm text-stone">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-parchment">{formatINR(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({order.shippingMethod} estimate)</span>
                <span className="font-mono text-parchment">{formatINR(order.shippingAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span className="font-mono">-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-smoke/30 my-2" />
              <div className="flex justify-between text-base font-semibold text-parchment">
                <span>{order.paymentMethod === "cod" ? "Amount Due" : "Total Paid"}</span>
                <span className="font-mono text-ivory text-lg">{formatINR(order.totalAmount)}</span>
              </div>
              <p className="pt-2 text-xs text-stone/70">Invoice: {order.invoiceNumber ?? "will be generated on first download"}</p>
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
