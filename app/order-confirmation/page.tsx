import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Order Confirmed | Kothakhahon Prokashoni",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderConfirmationPageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

function formatDate(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const { orderId } = await searchParams;
  const session = await getSession();
  const isLoggedIn = !!session;

  // Case 1: No orderId provided
  if (!orderId) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center md:px-8">
        <div className="editorial-panel w-full rounded-[30px] border border-smoke bg-obsidian p-8 md:p-12 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <svg className="h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-title text-4xl text-ivory tracking-tight">Order Placed</h1>
          <p className="font-body text-base text-parchment leading-relaxed max-w-md mx-auto">
            Your order has been placed. If you have any questions, please contact the editorial desk at{" "}
            <a href="mailto:editor@kothakhahon.com" className="text-gold underline hover:text-gold-dim transition">
              editor@kothakhahon.com
            </a>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/books"
              className="fx-button rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim text-center"
            >
              CONTINUE SHOPPING
            </Link>
            {isLoggedIn && (
              <Link
                href="/account/orders"
                className="fx-button rounded-full border border-smoke bg-obsidian px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold text-center"
              >
                VIEW ALL ORDERS
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fetch Order
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  // Case 2: Order ID provided but not found in DB
  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center md:px-8">
        <div className="editorial-panel w-full rounded-[30px] border border-smoke bg-obsidian p-8 md:p-12 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-title text-4xl text-ivory tracking-tight">Order Not Found</h1>
          <p className="font-body text-base text-parchment leading-relaxed max-w-md mx-auto">
            We could not find this order. If you have questions, contact{" "}
            <a href="mailto:editor@kothakhahon.com" className="text-gold underline hover:text-gold-dim transition">
              editor@kothakhahon.com
            </a>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/books"
              className="fx-button rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim text-center"
            >
              CONTINUE SHOPPING
            </Link>
            {isLoggedIn && (
              <Link
                href="/account/orders"
                className="fx-button rounded-full border border-smoke bg-obsidian px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold text-center"
              >
                VIEW ALL ORDERS
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Order exists
  const fullAddress = [
    order.addressLine1,
    order.addressLine2,
    `${order.city}, ${order.state} ${order.postalCode}`,
    order.country,
  ]
    .filter(Boolean)
    .join(", ");

  const paymentMethodLabel = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";

  const orderJsonLd = {
    "@context": "https://schema.org",
    "@type": "Order",
    "orderNumber": order.id,
    "orderDate": order.createdAt.toISOString(),
    "orderStatus": "https://schema.org/OrderProcessing",
    "priceCurrency": "INR",
    "price": order.totalAmount,
    "paymentMethod": order.paymentMethod === "cod" ? "https://schema.org/CashOnDelivery" : "https://schema.org/CreditCard",
    "customer": {
      "@type": "Person",
      "name": order.customerName,
      "email": order.customerEmail,
      "telephone": order.customerPhone,
    },
    "billingAddress": {
      "@type": "PostalAddress",
      "streetAddress": [order.addressLine1, order.addressLine2].filter(Boolean).join(", "),
      "addressLocality": order.city,
      "addressRegion": order.state,
      "postalCode": order.postalCode,
      "addressCountry": order.country,
    },
    "orderedItem": order.items.map((item) => ({
      "@type": "OrderItem",
      "orderedItem": {
        "@type": "Book",
        "name": item.bookTitle,
        "author": {
          "@type": "Person",
          "name": item.bookAuthor,
        },
      },
      "orderQuantity": item.quantity,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-8">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orderJsonLd) }}
      />

      <div className="editorial-panel w-full rounded-[30px] border border-smoke bg-obsidian p-6 md:p-10 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <svg className="h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-title text-4xl text-ivory tracking-tight">Thank you for your order</h1>
          <p className="font-body text-base text-stone">
            Order Reference: <span className="font-mono text-parchment font-semibold">#{order.id.slice(-8).toUpperCase()}</span>
          </p>
          <p className="font-body text-sm text-stone">
            Date: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <h3 className="font-ui text-xs tracking-[0.12em] text-stone uppercase mb-3">Items Ordered</h3>
          <div className="overflow-x-auto border border-smoke/30 rounded-xl bg-void/50 p-4">
            <table className="w-full text-left text-sm text-parchment border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-smoke/20 font-ui text-[11px] tracking-[0.12em] text-stone uppercase">
                  <th className="py-2 pr-4">Book Title</th>
                  <th className="py-2 px-4">Author</th>
                  <th className="py-2 px-4 text-center">Qty</th>
                  <th className="py-2 pl-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-smoke/10 font-body">
                {order.items.map((item) => (
                  <tr key={item.id} className="text-stone">
                    <td className="py-3 pr-4 font-medium text-ivory">{item.bookTitle}</td>
                    <td className="py-3 px-4">{item.bookAuthor}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 pl-4 text-right font-mono text-parchment">{formatINR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Invoice Totals */}
            <div className="mt-6 space-y-2 border-t border-smoke/20 pt-4 text-sm text-stone">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-parchment">{formatINR(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-parchment">{formatINR(order.shippingAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span className="font-mono">-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-smoke/20 pt-3 text-base">
                <span className="font-ui text-[11px] tracking-[0.12em] text-stone uppercase font-semibold">Total</span>
                <span className="font-title text-2xl text-gold">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Address details */}
        <div className="grid gap-6 border-t border-smoke/30 pt-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="font-ui text-xs tracking-[0.12em] text-stone uppercase mb-2">Customer Info</h3>
            <p className="font-body text-sm font-medium text-parchment">{order.customerName}</p>
            <p className="font-body text-sm text-stone">{order.customerEmail}</p>
            <p className="font-body text-sm text-stone">{order.customerPhone}</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-ui text-xs tracking-[0.12em] text-stone uppercase mb-2">Shipping Address</h3>
            <p className="font-body text-sm text-parchment leading-relaxed">{fullAddress}</p>
          </div>
        </div>

        {/* Payment details */}
        <div className="grid gap-6 border-t border-smoke/30 pt-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="font-ui text-xs tracking-[0.12em] text-stone uppercase mb-1">Payment Method</h3>
            <p className="font-body text-sm font-medium text-gold">{paymentMethodLabel}</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-ui text-xs tracking-[0.12em] text-stone uppercase mb-1">Payment Status</h3>
            <p className="font-body text-sm text-parchment capitalize">{order.paymentStatus}</p>
          </div>
        </div>

        {/* Confirmation footer note */}
        <div className="border-t border-smoke/30 pt-6 text-center space-y-6">
          <p className="font-body text-sm text-stone">
            You will receive a confirmation email shortly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/books"
              className="fx-button rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim text-center"
            >
              CONTINUE SHOPPING
            </Link>
            {isLoggedIn && (
              <Link
                href="/account/orders"
                className="fx-button rounded-full border border-smoke bg-obsidian px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold text-center"
              >
                VIEW ALL ORDERS
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
