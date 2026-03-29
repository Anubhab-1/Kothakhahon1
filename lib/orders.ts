import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

export function getPaymentMethodLabel(method: PaymentMethod) {
  return method === "cod" ? "Cash on delivery" : "Online payment";
}

export function getPaymentMethodShortLabel(method: PaymentMethod) {
  return method === "cod" ? "COD" : "ONLINE";
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "fulfilled":
      return "Fulfilled";
    case "cancelled":
      return "Cancelled";
    case "paid":
      return "Legacy paid";
    case "failed":
      return "Legacy failed";
    case "pending":
    default:
      return "Pending";
  }
}

export function getOrderStatusShortLabel(status: OrderStatus) {
  switch (status) {
    case "fulfilled":
      return "FULFILLED";
    case "cancelled":
      return "CANCELLED";
    case "paid":
      return "PAID";
    case "failed":
      return "FAILED";
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
