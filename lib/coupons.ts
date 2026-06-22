import { Prisma } from "@/generated/prisma/client";

export type CouponDiscountInput = {
  type: "percent" | "flat";
  value: number;
  subtotalAmount: number;
};

export class CouponUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponUsageError";
  }
}

export function calculateCouponDiscount({
  type,
  value,
  subtotalAmount,
}: CouponDiscountInput) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeSubtotal = Number.isFinite(subtotalAmount) ? Math.max(0, subtotalAmount) : 0;

  if (type === "percent") {
    return Math.min(safeSubtotal, Math.round((safeSubtotal * safeValue) / 100));
  }

  return Math.min(safeValue, safeSubtotal);
}

export async function consumeCouponForOrder(
  tx: Prisma.TransactionClient,
  options: {
    couponId: string;
    orderId: string;
    userId?: string | null;
    discount: number;
  },
) {
  if (options.discount <= 0) {
    return "skipped" as const;
  }

  try {
    const existingUse = await tx.couponUse.findUnique({
      where: { orderId: options.orderId },
    });

    if (existingUse) {
      return "already_consumed" as const;
    }

    const incremented = await tx.coupon.updateMany({
      where: {
        id: options.couponId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    if (incremented.count !== 1) {
      throw new CouponUsageError("This coupon is no longer available.");
    }

    await tx.couponUse.create({
      data: {
        couponId: options.couponId,
        orderId: options.orderId,
        userId: options.userId ?? null,
        discount: options.discount,
      },
    });

    return "consumed" as const;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "already_consumed" as const;
    }

    throw error;
  }
}

export async function releaseCouponForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const existingUse = await tx.couponUse.findUnique({
    where: { orderId },
    select: { id: true, couponId: true },
  });

  if (!existingUse) {
    return "not_consumed" as const;
  }

  await tx.couponUse.delete({
    where: { id: existingUse.id },
  });

  await tx.coupon.update({
    where: { id: existingUse.couponId },
    data: {
      usedCount: { decrement: 1 },
    },
  });

  return "released" as const;
}
