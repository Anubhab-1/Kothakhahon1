import { notFound } from "next/navigation";
import AdminNotice from "@/components/admin/AdminNotice";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/orders";

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: AdminOrderDetailPageProps) {
  const [{ id }, search, order] = await Promise.all([
    params,
    searchParams,
    params.then(({ id: orderId }) =>
      db.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      }),
    ),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Orders"
        title={`Order ${order.id.slice(0, 8)}`}
        description="Review payment method, transaction details, shipping details, and the exact item snapshot captured at checkout."
      />

      <AdminNotice notice={search.saved ? "Order workflow updated." : undefined} error={search.error} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-card">
          <p className="admin-eyebrow">Order Items</p>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-ink/10 bg-white/72 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-title text-2xl text-ink">{item.bookTitle}</p>
                    <p className="font-body text-sm text-ink/58">{item.bookAuthor}</p>
                  </div>
                  <p className="font-ui text-[11px] tracking-[0.16em] text-brass">QTY {item.quantity}</p>
                </div>
                <p className="mt-3 font-body text-base text-ink/72">Rs. {item.price.toFixed(2)} each</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card">
            <p className="admin-eyebrow">Workflow</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="admin-status-pill">{getOrderStatusLabel(order.status)}</span>
              <span className="admin-status-pill">{getPaymentStatusLabel(order.paymentStatus)}</span>
            </div>
            <div className="mt-5">
              <OrderStatusForm
                orderId={id}
                currentStatus={order.status}
                currentPaymentStatus={order.paymentStatus}
                paymentMethod={order.paymentMethod}
              />
            </div>
          </div>

          <div className="admin-card space-y-3">
            <p className="admin-eyebrow">Customer</p>
            <p className="font-title text-3xl text-ink">{order.customerName}</p>
            <p className="font-body text-base text-ink/72">{order.customerEmail}</p>
            <p className="font-body text-base text-ink/72">{order.customerPhone}</p>
            <div className="pt-3 text-base leading-relaxed text-ink/70">
              <p>{order.addressLine1}</p>
              {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
              <p>
                {order.city}, {order.state} {order.postalCode}
              </p>
              <p>{order.country}</p>
            </div>
          </div>

          <div className="admin-card space-y-3">
            <p className="admin-eyebrow">Payment & Totals</p>
            <p className="font-body text-base text-ink/72">
              Payment method: {getPaymentMethodLabel(order.paymentMethod)}
            </p>
            <p className="font-body text-base text-ink/72">
              Payment state: {getPaymentStatusLabel(order.paymentStatus)}
            </p>
            <p className="font-body text-base text-ink/72">
              Fulfillment state: {getOrderStatusLabel(order.status)}
            </p>
            <p className="font-body text-base text-ink/72">Subtotal: Rs. {order.subtotalAmount.toFixed(2)}</p>
            <p className="font-body text-base text-ink/72">Shipping: Rs. {order.shippingAmount.toFixed(2)}</p>
            <p className="font-title text-3xl text-ink">Total: Rs. {order.totalAmount.toFixed(2)}</p>
            <p className="font-body text-sm text-ink/56">
              Account owner: {order.userId ?? "Guest order or legacy email-linked order"}
            </p>
            {order.paymentMethod === "razorpay" ? (
              <>
                <p className="font-body text-sm text-ink/56">Razorpay order: {order.razorpayOrderId ?? "Not created"}</p>
                <p className="font-body text-sm text-ink/56">Razorpay payment: {order.razorpayPaymentId ?? "Not paid yet"}</p>
              </>
            ) : (
              <p className="font-body text-sm text-ink/56">
                Cash is due on delivery. No Razorpay transaction is attached to this order.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
