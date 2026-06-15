import Link from "next/link";
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
          <div style={{ marginTop:"1.25rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ borderRadius:"14px", border:"1px solid rgba(99,102,241,0.12)", background:"rgba(99,102,241,0.05)", padding:"1rem 1.25rem" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem" }}>
                  <div>
                    <p style={{ fontSize:"1rem", fontWeight:700, color:"#f0f2ff" }}>{item.bookTitle}</p>
                    <p style={{ fontSize:"0.82rem", color:"#64748b", marginTop:"2px" }}>{item.bookAuthor}</p>
                  </div>
                  <span style={{ display:"inline-block", padding:"0.2rem 0.6rem", borderRadius:"999px", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#a5b4fc", flexShrink:0 }}>QTY {item.quantity}</span>
                </div>
                <p style={{ marginTop:"0.5rem", fontSize:"0.85rem", color:"#94a3b8", fontVariantNumeric:"tabular-nums" }}>₹ {item.price.toFixed(2)} each</p>
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
            <div className="mt-4">
              <Link href={`/api/orders/${order.id}/invoice`} className="admin-link-button">
                Download invoice
              </Link>
            </div>
            <div className="mt-5">
              <OrderStatusForm
                orderId={id}
                currentStatus={order.status}
                currentPaymentStatus={order.paymentStatus}
                paymentMethod={order.paymentMethod}
                currentTrackingNumber={order.trackingNumber}
                currentCarrier={order.carrier}
              />
            </div>
          </div>

          <div className="admin-card" style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
            <p className="admin-eyebrow">Customer</p>
            <p style={{ fontSize:"1.3rem", fontWeight:700, color:"#f0f2ff", marginTop:"0.3rem" }}>{order.customerName}</p>
            <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>{order.customerEmail}</p>
            <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>{order.customerPhone}</p>
            <div style={{ marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid rgba(99,102,241,0.1)", fontSize:"0.875rem", color:"#64748b", lineHeight:1.7 }}>
              <p>{order.addressLine1}</p>
              {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
              <p>{order.city}, {order.state} {order.postalCode}</p>
              <p>{order.country}</p>
            </div>
          </div>

          <div className="admin-card" style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            <p className="admin-eyebrow">Payment &amp; Totals</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", marginTop:"0.4rem" }}>
              <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>Method: {getPaymentMethodLabel(order.paymentMethod)}</p>
              <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>Payment state: {getPaymentStatusLabel(order.paymentStatus)}</p>
              <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>Subtotal: ₹ {order.subtotalAmount.toFixed(2)}</p>
              <p style={{ fontSize:"0.875rem", color:"#94a3b8" }}>Shipping: ₹ {order.shippingAmount.toFixed(2)}</p>
            </div>
            <p style={{ fontSize:"1.5rem", fontWeight:800, color:"#f0f2ff", fontVariantNumeric:"tabular-nums", borderTop:"1px solid rgba(99,102,241,0.1)", paddingTop:"0.6rem", marginTop:"0.25rem" }}>Total: ₹ {order.totalAmount.toFixed(2)}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem", marginTop:"0.5rem", paddingTop:"0.5rem", borderTop:"1px solid rgba(99,102,241,0.08)" }}>
              <p style={{ fontSize:"0.78rem", color:"#475569" }}>Invoice: {order.invoiceNumber ?? "Generated on first download"}</p>
              <p style={{ fontSize:"0.78rem", color:"#475569" }}>Account: {order.userId ?? "Guest / legacy email order"}</p>
              {order.paymentMethod === "razorpay" ? (
                <>
                  <p style={{ fontSize:"0.78rem", color:"#475569" }}>RZ Order: {order.razorpayOrderId ?? "Not created"}</p>
                  <p style={{ fontSize:"0.78rem", color:"#475569" }}>RZ Payment: {order.razorpayPaymentId ?? "Not paid yet"}</p>
                </>
              ) : (
                <p style={{ fontSize:"0.78rem", color:"#475569" }}>Cash on delivery — no Razorpay transaction.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
