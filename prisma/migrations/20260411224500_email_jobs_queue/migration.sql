-- CreateEnum
CREATE TYPE "EmailJobType" AS ENUM (
  'contact_customer',
  'contact_admin',
  'manuscript_customer',
  'manuscript_admin',
  'newsletter_customer',
  'newsletter_admin',
  'cod_order_customer',
  'cod_order_admin',
  'paid_order_customer',
  'paid_order_admin'
);

-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "EmailJob" (
  "id" TEXT NOT NULL,
  "type" "EmailJobType" NOT NULL,
  "status" "EmailJobStatus" NOT NULL DEFAULT 'queued',
  "dedupeKey" TEXT,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastError" TEXT,
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailJob_dedupeKey_key" ON "EmailJob"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailJob_status_runAt_idx" ON "EmailJob"("status", "runAt");

-- CreateIndex
CREATE INDEX "EmailJob_type_status_idx" ON "EmailJob"("type", "status");
