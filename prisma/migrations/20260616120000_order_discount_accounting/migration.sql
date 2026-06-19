ALTER TABLE "Order"
ADD COLUMN "couponId" TEXT,
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "couponCode" TEXT;

CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
