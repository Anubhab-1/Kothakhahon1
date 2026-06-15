import { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { updateOrderStatusAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export default function OrderStatusForm({
  orderId,
  currentStatus,
  currentPaymentStatus,
  paymentMethod,
  currentTrackingNumber,
  currentCarrier,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  currentTrackingNumber?: string | null;
  currentCarrier?: string | null;
}) {
  const fulfillmentStatuses: OrderStatus[] = [
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

  return (
    <form action={updateOrderStatusAction} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <label className="block space-y-2">
        <span className="admin-field-label">Fulfillment Status</span>
        <select name="status" className="admin-select" defaultValue={currentStatus}>
          {fulfillmentStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="admin-field-label">Payment Status</span>
        <select name="paymentStatus" className="admin-select" defaultValue={currentPaymentStatus}>
          {(paymentMethod === "cod"
            ? (["pending", "paid"] as PaymentStatus[])
            : (["pending", "paid", "failed", "refunded"] as PaymentStatus[])
          ).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="admin-field-label">Carrier</span>
        <select name="carrier" className="admin-select" defaultValue={currentCarrier ?? ""}>
          <option value="">No Carrier / Hand Delivery</option>
          <option value="india-post">India Post (Speed Post)</option>
          <option value="delhivery">Delhivery</option>
          <option value="dhl">DHL</option>
          <option value="fedex">FedEx</option>
          <option value="custom">Other Carrier</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="admin-field-label">Tracking Number</span>
        <input
          type="text"
          name="trackingNumber"
          className="admin-input"
          defaultValue={currentTrackingNumber ?? ""}
          placeholder="e.g. EB123456789IN, 123456789"
        />
      </label>

      <AdminSubmitButton idleLabel="Update Order" pendingLabel="Updating..." />
    </form>
  );
}
