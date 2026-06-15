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

  // Derive active timeline steps
  const isPaidOrConfirmed = order.paymentStatus === "paid" || order.status !== "pending" || order.paidAt || order.processingAt;
  const isPacked = order.packedAt || ["packed", "shipped", "delivered"].includes(order.status);
  const isShipped = order.shippedAt || ["shipped", "delivered"].includes(order.status);
  const isDelivered = order.deliveredAt || order.status === "delivered";

  const timeline = [
    { label: "Order Placed", date: order.createdAt, active: true, desc: "Order details received and enqueued." },
    {
      label: order.paymentMethod === "cod" ? "Order Confirmed" : "Payment Received",
      date: order.processingAt ?? order.paidAt ?? (isPaidOrConfirmed ? order.createdAt : null),
      active: !!isPaidOrConfirmed,
      desc: order.paymentMethod === "cod" ? "COD order verified by publishing desk." : "Transaction authorized and settled.",
    },
    { label: "Packed", date: order.packedAt, active: !!isPacked, desc: "Parcel prepared and sealed at our Kolkata desk." },
    { label: "Shipped", date: order.shippedAt, active: !!isShipped, desc: "Handed over to carrier for transit." },
    { label: "Delivered", date: order.deliveredAt, active: !!isDelivered, desc: "Successfully delivered to recipient." },
  ];

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
                    Please track directly on the carrier's portal using the tracking number above.
                  </p>
                )}
              </div>
            )}

            {/* Visual Timeline */}
            <div className="mt-8 relative border-l border-smoke/60 pl-6 space-y-6">
              {timeline.map((stepItem, index) => (
                <div key={index} className="relative">
                  {/* Step Dot */}
                  <div
                    className={cn(
                      "absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition duration-150",
                      stepItem.active
                        ? "border-gold bg-gold text-void"
                        : "border-smoke bg-void"
                    )}
                  />
                  <div>
                    <h4
                      className={cn(
                        "font-title text-2xl transition",
                        stepItem.active ? "text-ivory" : "text-stone"
                      )}
                    >
                      {stepItem.label}
                    </h4>
                    {stepItem.active && stepItem.date ? (
                      <p className="font-mono text-xs text-gold">
                        {formatDisplayDate(
                          typeof stepItem.date === "string"
                            ? stepItem.date
                            : stepItem.date.toISOString(),
                          ""
                        )}
                      </p>
                    ) : null}
                    <p className="mt-1 font-body text-sm text-stone">{stepItem.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-smoke/70 pt-6 space-y-3 font-body text-base text-stone">
              <p className="text-parchment font-semibold">Total paid {formatINR(Number(order.totalAmount))}</p>
              <p>Invoice {order.invoiceNumber ?? "will be generated on first download"}</p>
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
