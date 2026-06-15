-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "inventoryCommittedAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);
