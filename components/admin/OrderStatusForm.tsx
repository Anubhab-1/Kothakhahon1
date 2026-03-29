import { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { updateOrderStatusAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export default function OrderStatusForm({
  orderId,
  currentStatus,
  currentPaymentStatus,
  paymentMethod,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}) {
  return (
    <form action={updateOrderStatusAction} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <label className="block space-y-2">
        <span className="admin-field-label">Fulfillment Status</span>
        <select name="status" className="admin-select" defaultValue={currentStatus}>
          {(["pending", "fulfilled", "cancelled"] as OrderStatus[]).map((status) => (
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
      <AdminSubmitButton idleLabel="Update Order" pendingLabel="Updating..." />
    </form>
  );
}
