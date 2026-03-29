-- Reconcile schema changes that were previously applied via db push
CREATE TYPE "PaymentMethod" AS ENUM ('razorpay', 'cod');
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CUSTOMER');

ALTER TABLE "AdminUser"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

UPDATE "AdminUser"
SET "role" = 'ADMIN'
WHERE "role" = 'CUSTOMER';

CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'razorpay';
