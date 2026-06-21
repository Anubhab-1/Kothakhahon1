-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "coverBlurDataUrl" TEXT,
ADD COLUMN     "searchVector" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "OrderIdempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderIdempotency_key_key" ON "OrderIdempotency"("key");
