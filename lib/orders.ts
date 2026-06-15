import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

export function getPaymentMethodLabel(method: PaymentMethod) {
  return method === "cod" ? "Cash on delivery" : "Online payment";
}

export function getPaymentMethodShortLabel(method: PaymentMethod) {
  return method === "cod" ? "COD" : "ONLINE";
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "payment_pending":
      return "Payment pending";
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "packed":
      return "Packed";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    case "pending":
    default:
      return "Pending";
  }
}

export function getOrderStatusShortLabel(status: OrderStatus) {
  switch (status) {
    case "payment_pending":
      return "PAYMENT PENDING";
    case "paid":
      return "PAID";
    case "processing":
      return "PROCESSING";
    case "packed":
      return "PACKED";
    case "shipped":
      return "SHIPPED";
    case "delivered":
      return "DELIVERED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
      return "REFUNDED";
    case "pending":
    default:
      return "PENDING";
  }
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    case "pending":
    default:
      return "Pending";
  }
}

export function getPaymentStatusShortLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "PAID";
    case "failed":
      return "FAILED";
    case "refunded":
      return "REFUNDED";
    case "pending":
    default:
      return "PENDING";
  }
}
