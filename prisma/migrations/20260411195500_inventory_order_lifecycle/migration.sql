-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('in_stock', 'low_stock', 'out_of_stock');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('pending', 'payment_pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE
    WHEN "status"::text = 'fulfilled' THEN 'delivered'::"OrderStatus_new"
    WHEN "status"::text = 'failed' THEN 'cancelled'::"OrderStatus_new"
    ELSE "status"::text::"OrderStatus_new"
  END
);
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "stockQuantity" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "stockStatus" "StockStatus" NOT NULL DEFAULT 'in_stock';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "packedAt" TIMESTAMP(3),
ADD COLUMN     "processingAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3);

-- Backfill
UPDATE "Order"
SET "deliveredAt" = COALESCE("deliveredAt", "updatedAt")
WHERE "status" = 'delivered';

UPDATE "Order"
SET "cancelledAt" = COALESCE("cancelledAt", "updatedAt")
WHERE "status" = 'cancelled';

UPDATE "Book"
SET "stockStatus" = CASE
  WHEN "stockQuantity" <= 0 THEN 'out_of_stock'::"StockStatus"
  WHEN "stockQuantity" <= "lowStockThreshold" THEN 'low_stock'::"StockStatus"
  ELSE 'in_stock'::"StockStatus"
END;

-- CreateIndex
CREATE INDEX "Book_stockStatus_stockQuantity_idx" ON "Book"("stockStatus", "stockQuantity");
