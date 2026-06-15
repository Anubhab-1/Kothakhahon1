-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3),
ADD COLUMN "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "Order"("invoiceNumber");
