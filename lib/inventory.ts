import type { StockStatus } from "@/generated/prisma/client";

export const DEFAULT_STOCK_QUANTITY = 12;
export const DEFAULT_LOW_STOCK_THRESHOLD = 3;

export function normalizeStockQuantity(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_STOCK_QUANTITY;
  }

  return Math.max(0, Math.floor(value));
}

export function normalizeLowStockThreshold(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_LOW_STOCK_THRESHOLD;
  }

  return Math.max(0, Math.floor(value));
}

export function getDerivedStockStatus(
  stockQuantity: number,
  lowStockThreshold: number,
): StockStatus {
  if (stockQuantity <= 0) {
    return "out_of_stock";
  }

  if (stockQuantity <= lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
}

export function getEffectiveStockStatus(options: {
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  stockStatus?: StockStatus | null;
}) {
  const stockQuantity = normalizeStockQuantity(options.stockQuantity);
  const lowStockThreshold = normalizeLowStockThreshold(options.lowStockThreshold);

  return (
    options.stockStatus ??
    getDerivedStockStatus(stockQuantity, lowStockThreshold)
  );
}

export function isBookAvailableForSale(options: {
  price?: number | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  stockStatus?: StockStatus | null;
}) {
  const status = getEffectiveStockStatus(options);
  const stockQuantity = normalizeStockQuantity(options.stockQuantity);

  return typeof options.price === "number" && options.price > 0 && status !== "out_of_stock" && stockQuantity > 0;
}

export function getStockStatusLabel(status: StockStatus) {
  switch (status) {
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    case "in_stock":
    default:
      return "In stock";
  }
}
