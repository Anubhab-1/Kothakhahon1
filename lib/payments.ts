import crypto from "node:crypto";
import {
  Order,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type OrderStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { releaseCouponForOrder } from "@/lib/coupons";
import { commitOrderInventory } from "@/lib/order-inventory";

type LockedOrderRow = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
};

type PaidOrderRecord = Order & {
  items: OrderItem[];
};

type PaidOrderResult =
  | {
      outcome: "paid";
      orderId: string;
      order: PaidOrderRecord;
    }
  | {
      outcome: "already_paid";
      orderId: string;
      order: null;
    };

export class PaymentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}

function createHmacHex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function signaturesMatch(expectedSignature: string, providedSignature: string) {
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function isRazorpayCheckoutSignatureValid(options: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  razorpaySecret: string;
}) {
  const expectedSignature = createHmacHex(
    options.razorpaySecret,
    `${options.razorpayOrderId}|${options.razorpayPaymentId}`,
  );

  return signaturesMatch(expectedSignature, options.razorpaySignature);
}

export function isRazorpayWebhookSignatureValid(options: {
  rawBody: string;
  webhookSignature: string;
  webhookSecret: string;
}) {
  const expectedSignature = createHmacHex(options.webhookSecret, options.rawBody);
  return signaturesMatch(expectedSignature, options.webhookSignature);
}

async function lockOrderById(tx: Prisma.TransactionClient, orderId: string) {
  const rows = await tx.$queryRaw<LockedOrderRow[]>(Prisma.sql`
    SELECT
      "id",
      "status",
      "paymentStatus",
      "paymentMethod",
      "razorpayOrderId",
      "razorpayPaymentId"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `);

  return rows[0] ?? null;
}

async function lockOrderByRazorpayOrderId(
  tx: Prisma.TransactionClient,
  razorpayOrderId: string,
) {
  const rows = await tx.$queryRaw<LockedOrderRow[]>(Prisma.sql`
    SELECT
      "id",
      "status",
      "paymentStatus",
      "paymentMethod",
      "razorpayOrderId",
      "razorpayPaymentId"
    FROM "Order"
    WHERE "razorpayOrderId" = ${razorpayOrderId}
    FOR UPDATE
  `);

  return rows[0] ?? null;
}

export async function finalizePaidRazorpayOrder(options: {
  localOrderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}) {
  return db.$transaction(async (tx): Promise<PaidOrderResult> => {
    const lockedOrder =
      (options.localOrderId ? await lockOrderById(tx, options.localOrderId) : null) ??
      (await lockOrderByRazorpayOrderId(tx, options.razorpayOrderId));

    if (!lockedOrder) {
      throw new PaymentProcessingError("Order not found.");
    }

    if (lockedOrder.paymentMethod !== "razorpay") {
      throw new PaymentProcessingError("This order does not use Razorpay.");
    }

    if (
      lockedOrder.razorpayOrderId &&
      lockedOrder.razorpayOrderId !== options.razorpayOrderId
    ) {
      throw new PaymentProcessingError("Order identifier mismatch.");
    }

    if (lockedOrder.status === "cancelled" || lockedOrder.status === "refunded") {
      throw new PaymentProcessingError("This order can no longer accept payment.");
    }

    if (lockedOrder.paymentStatus === "paid") {
      if (
        lockedOrder.razorpayPaymentId &&
        lockedOrder.razorpayPaymentId !== options.razorpayPaymentId
      ) {
        throw new PaymentProcessingError("A different payment is already attached to this order.");
      }

      return {
        outcome: "already_paid",
        orderId: lockedOrder.id,
        order: null,
      };
    }

    await commitOrderInventory(tx, lockedOrder.id);

    const paidOrder = await tx.order.update({
      where: { id: lockedOrder.id },
      data: {
        status:
          lockedOrder.status === "payment_pending" || lockedOrder.status === "pending"
            ? "paid"
            : lockedOrder.status,
        paymentStatus: "paid",
        razorpayPaymentId: options.razorpayPaymentId,
        paidAt: new Date(),
        paymentCollectedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return {
      outcome: "paid",
      orderId: paidOrder.id,
      order: paidOrder,
    };
  });
}

export async function markRazorpayOrderFailed(options: {
  razorpayOrderId: string;
}) {
  return db.$transaction(async (tx) => {
    const lockedOrder = await lockOrderByRazorpayOrderId(tx, options.razorpayOrderId);

    if (!lockedOrder) {
      return { outcome: "not_found" as const };
    }

    if (lockedOrder.paymentStatus === "paid") {
      return { outcome: "already_paid" as const, orderId: lockedOrder.id };
    }

    if (lockedOrder.paymentStatus === "failed") {
      return { outcome: "already_failed" as const, orderId: lockedOrder.id };
    }

    await releaseCouponForOrder(tx, lockedOrder.id);

    await tx.order.update({
      where: { id: lockedOrder.id },
      data: {
        paymentStatus: "failed",
        status:
          lockedOrder.status === "payment_pending" || lockedOrder.status === "pending"
            ? "cancelled"
            : lockedOrder.status,
        cancelledAt:
          lockedOrder.status === "payment_pending" || lockedOrder.status === "pending"
            ? new Date()
            : undefined,
      },
    });

    return { outcome: "marked_failed" as const, orderId: lockedOrder.id };
  });
}
