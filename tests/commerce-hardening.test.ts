import { test, describe } from "node:test";
import assert from "node:assert";
import { calculateCouponDiscount } from "../lib/coupons";
import { generateInvoicePdf } from "../lib/invoices";
import { commitOrderInventory } from "../lib/order-inventory";
import { POST as bookViewHandler } from "../app/api/books/[id]/view/route";
import { db } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

describe("Commerce Hardening Integration & Logic", () => {
  describe("calculateCouponDiscount", () => {
    test("percentage discount capping matches correct limits", () => {
      // 10% of 1000 = 100
      assert.strictEqual(
        calculateCouponDiscount({ type: "percent", value: 10, subtotalAmount: 1000 }),
        100
      );
      // Flat 200 discount on subtotal of 150 = 150 (cap at subtotal)
      assert.strictEqual(
        calculateCouponDiscount({ type: "flat", value: 200, subtotalAmount: 150 }),
        150
      );
    });
  });

  describe("commitOrderInventory Idempotency", () => {
    test("already committed order skips stock modification", async () => {
      let bookUpdated = false;
      let orderUpdated = false;

      const mockTx = {
        order: {
          findUnique: async () => ({
            id: "order-1",
            inventoryCommittedAt: new Date(),
            inventoryReleasedAt: null,
            items: [
              { bookId: "book-1", bookTitle: "Test Book", quantity: 2 }
            ]
          }),
          update: async () => {
            orderUpdated = true;
            return {};
          }
        },
        book: {
          findUnique: async () => ({
            id: "book-1",
            stockQuantity: 10,
            lowStockThreshold: 3
          }),
          update: async () => {
            bookUpdated = true;
            return {};
          }
        }
      } as unknown as Prisma.TransactionClient;

      const result = await commitOrderInventory(mockTx, "order-1");

      assert.strictEqual(result, "already_committed");
      assert.strictEqual(bookUpdated, false);
      assert.strictEqual(orderUpdated, false);
    });

    test("uncommitted order commits stock and updates database status", async () => {
      let bookUpdated = false;
      let orderUpdated = false;

      const mockTx = {
        order: {
          findUnique: async () => ({
            id: "order-1",
            inventoryCommittedAt: null,
            inventoryReleasedAt: null,
            items: [
              { bookId: "book-1", bookTitle: "Test Book", quantity: 2 }
            ]
          }),
          update: async () => {
            orderUpdated = true;
            return {};
          }
        },
        book: {
          findUnique: async () => ({
            id: "book-1",
            stockQuantity: 10,
            lowStockThreshold: 3
          }),
          update: async () => {
            bookUpdated = true;
            return {};
          }
        },
        emailJob: {
          create: async () => ({})
        }
      } as unknown as Prisma.TransactionClient;

      const result = await commitOrderInventory(mockTx, "order-1");

      assert.strictEqual(result, "committed");
      assert.strictEqual(bookUpdated, true);
      assert.strictEqual(orderUpdated, true);
    });
  });

  describe("Invoice PDF Generation", () => {
    test("generates valid PDF buffer with proper headers", () => {
      const mockOrder = {
        id: "order-12345",
        userId: "user-1",
        couponId: null,
        status: "paid",
        paymentMethod: "cod",
        paymentStatus: "paid",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "9876543210",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700001",
        country: "India",
        subtotalAmount: 500,
        shippingAmount: 70,
        shippingMethod: "standard",
        discountAmount: 50,
        couponCode: "WELCOME50",
        totalAmount: 520,
        invoiceNumber: "KKH-2026-ORDER-12345",
        invoiceIssuedAt: new Date(),
        trackingNumber: null,
        carrier: null,
        razorpayOrderId: null,
        razorpayPaymentId: null,
        paidAt: new Date(),
        paymentCollectedAt: null,
        inventoryCommittedAt: new Date(),
        inventoryReleasedAt: null,
        processingAt: null,
        packedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        refundedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item-1",
            orderId: "order-12345",
            bookId: "book-1",
            bookSlug: "book-one",
            bookTitle: "Book One Title",
            bookAuthor: "Author Name",
            bookCoverUrl: null,
            quantity: 1,
            price: 500,
          }
        ]
      } as any;

      const pdfBuffer = generateInvoicePdf(mockOrder);
      assert.ok(pdfBuffer instanceof Buffer);
      assert.ok(pdfBuffer.length > 100);
      
      // Verify PDF file signature (%PDF-1.3 or %PDF-1.4 or similar)
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      assert.strictEqual(pdfHeader, "%PDF");
    });
  });

  describe("Book View API Route Throttling", () => {
    test("bookViewHandler rejects or accepts requests depending on rate limiter", async () => {
      let viewIncremented = false;
      const originalBook = db.book;
      Object.defineProperty(db, "book", {
        value: {
          update: async () => {
            viewIncremented = true;
            return {};
          },
        },
        configurable: true,
        writable: true,
      });

      const req = new Request("http://localhost/api/books/test-book/view", {
        method: "POST",
        headers: {
          "user-agent": "Mozilla/5.0",
          "x-real-ip": "127.0.0.1"
        }
      });

      const params = Promise.resolve({ id: "test-book" });

      try {
        const res = await bookViewHandler(req, { params });
        assert.strictEqual(res.status, 200);

        const body = await res.json();
        assert.deepStrictEqual(body, { success: true });
        assert.strictEqual(viewIncremented, true);
      } finally {
        Object.defineProperty(db, "book", {
          value: originalBook,
          configurable: true,
          writable: true,
        });
      }
    });
  });
});
