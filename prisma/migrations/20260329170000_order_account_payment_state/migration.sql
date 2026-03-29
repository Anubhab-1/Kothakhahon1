-- Add explicit payment state, account-linked orders, and backfill legacy rows
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

ALTER TABLE "Order"
ADD COLUMN "userId" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "paymentCollectedAt" TIMESTAMP(3);

UPDATE "Order"
SET
  "paymentStatus" = CASE
    WHEN "razorpayPaymentId" IS NOT NULL OR "status" = 'paid' THEN 'paid'::"PaymentStatus"
    WHEN "status" = 'failed' THEN 'failed'::"PaymentStatus"
    ELSE 'pending'::"PaymentStatus"
  END,
  "paymentCollectedAt" = COALESCE("paidAt", "paymentCollectedAt"),
  "status" = CASE
    WHEN "status" = 'paid' THEN 'pending'::"OrderStatus"
    WHEN "status" = 'failed' THEN 'cancelled'::"OrderStatus"
    ELSE "status"
  END;

UPDATE "Order" AS o
SET "userId" = u."id"
FROM "AdminUser" AS u
WHERE o."userId" IS NULL
  AND LOWER(o."customerEmail") = LOWER(u."email");

CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_status_paymentStatus_idx" ON "Order"("status", "paymentStatus");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "AdminUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
