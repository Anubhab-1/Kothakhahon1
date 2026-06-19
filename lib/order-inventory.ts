import { Prisma } from "@/generated/prisma/client";
import { getDerivedStockStatus } from "@/lib/inventory";
import { queueLowStockAdminEmail } from "@/lib/email-jobs";

export class InventoryAdjustmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryAdjustmentError";
  }
}

export function getStockAdjustmentData({
  nextQuantity,
  lowStockThreshold,
  soldQuantity = 0,
}: {
  nextQuantity: number;
  lowStockThreshold: number;
  soldQuantity?: number;
}) {
  return {
    stockQuantity: nextQuantity,
    stockStatus: getDerivedStockStatus(nextQuantity, lowStockThreshold),
    ...(soldQuantity > 0 ? { soldCount: { increment: soldQuantity } } : {}),
  };
}

async function getOrderForInventory(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      inventoryCommittedAt: true,
      inventoryReleasedAt: true,
      items: {
        select: {
          bookId: true,
          bookTitle: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    throw new InventoryAdjustmentError("Order not found for inventory adjustment.");
  }

  return order;
}

async function adjustBookStock(
  tx: Prisma.TransactionClient,
  bookId: string,
  quantityDelta: number,
  bookTitle: string,
  options: { countAsSale?: boolean } = {},
) {
  const book = await tx.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      stockQuantity: true,
      lowStockThreshold: true,
    },
  });

  if (!book) {
    throw new InventoryAdjustmentError(`Book "${bookTitle}" no longer exists.`);
  }

  const nextQuantity = book.stockQuantity + quantityDelta;
  if (nextQuantity < 0) {
    throw new InventoryAdjustmentError(`Insufficient stock for "${bookTitle}".`);
  }

  await tx.book.update({
    where: { id: bookId },
    data: getStockAdjustmentData({
      nextQuantity,
      lowStockThreshold: book.lowStockThreshold,
      soldQuantity: options.countAsSale && quantityDelta < 0 ? Math.abs(quantityDelta) : 0,
    }),
  });

  if (quantityDelta < 0 && nextQuantity <= book.lowStockThreshold) {
    await queueLowStockAdminEmail(bookId, tx);
  }
}

export async function commitOrderInventory(tx: Prisma.TransactionClient, orderId: string) {
  const order = await getOrderForInventory(tx, orderId);

  if (order.inventoryCommittedAt && !order.inventoryReleasedAt) {
    return "already_committed" as const;
  }

  if (order.inventoryCommittedAt && order.inventoryReleasedAt) {
    throw new InventoryAdjustmentError(
      "Inventory was already released for this order. Re-commit manually if needed.",
    );
  }

  for (const item of order.items) {
    await adjustBookStock(tx, item.bookId, -item.quantity, item.bookTitle, {
      countAsSale: true,
    });
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      inventoryCommittedAt: new Date(),
      inventoryReleasedAt: null,
    },
  });

  return "committed" as const;
}

export async function releaseOrderInventory(tx: Prisma.TransactionClient, orderId: string) {
  const order = await getOrderForInventory(tx, orderId);

  if (!order.inventoryCommittedAt) {
    return "not_committed" as const;
  }

  if (order.inventoryReleasedAt) {
    return "already_released" as const;
  }

  for (const item of order.items) {
    await adjustBookStock(tx, item.bookId, item.quantity, item.bookTitle);
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      inventoryReleasedAt: new Date(),
    },
  });

  return "released" as const;
}
