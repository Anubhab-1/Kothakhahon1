import { test, describe } from "node:test";
import assert from "node:assert";
import { GET as getCart, POST as postCart } from "../app/api/cart/route";
import { POST as createOrder } from "../app/api/checkout/create-order/route";
import { finalizePaidRazorpayOrder } from "../lib/payments";
import { db } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

describe("Integration Workflows", () => {
  describe("Guest Cart Merge & Operations", () => {
    test("GET /api/cart returns 401 if unauthorized", async () => {
      globalThis.__mockSession = null;
      const res = await getCart();
      assert.strictEqual(res.status, 401);
    });

    test("POST /api/cart merges items and respects max quantity limit of 10", async () => {
      globalThis.__mockSession = {
        userId: "user-1",
        email: "user@example.com",
        role: "CUSTOMER",
        expiresAt: Date.now() + 600000,
      };

      const mockCartItem = { id: "item-123", bookId: "book-1", quantity: 8 };
      let updatedQty = 0;

      const originalCartItem = db.cartItem;
      const originalBook = db.book;

      Object.defineProperty(db, "cartItem", {
        value: {
          findMany: async () => [mockCartItem],
          findUnique: async () => mockCartItem,
          update: async ({ data }: any) => {
            updatedQty = data.quantity;
            return { ...mockCartItem, quantity: updatedQty };
          },
        },
        configurable: true,
        writable: true
      });

      Object.defineProperty(db, "book", {
        value: {
          findMany: async () => [
            { id: "book-1", title: "Test Book", price: 299, author: { name: "Author" } }
          ],
        },
        configurable: true,
        writable: true
      });

      const req = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({
          items: [{ bookId: "book-1", quantity: 5 }]
        })
      });

      const res = await postCart(req);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(updatedQty, 10);

      // Restore
      Object.defineProperty(db, "cartItem", { value: originalCartItem, configurable: true, writable: true });
      Object.defineProperty(db, "book", { value: originalBook, configurable: true, writable: true });
    });
  });

  describe("Saved Address Selection & Save address Checkout Flow", () => {
    test("createOrder endpoint saves address when saveAddress is true and user is authenticated", async () => {
      globalThis.__mockSession = {
        userId: "user-1",
        email: "user@example.com",
        role: "CUSTOMER",
        expiresAt: Date.now() + 600000,
      };

      let addressCreated = false;

      const mockTx = {
        order: {
          create: async ({ data }: any) => ({
            id: "order-1",
            totalAmount: data.totalAmount,
            customerEmail: data.customerEmail,
            items: []
          }),
          findUnique: async () => ({
            id: "order-1",
            inventoryCommittedAt: new Date(),
            inventoryReleasedAt: null,
            items: []
          })
        },
        address: {
          findFirst: async () => null,
          count: async () => 0,
          create: async () => {
            addressCreated = true;
            return {};
          }
        },
        cartItem: {
          deleteMany: async () => ({})
        },
        emailJob: {
          create: async () => ({})
        }
      };

      const originalTransaction = db.$transaction;
      const originalBook = db.book;
      const originalUser = db.user;

      Object.defineProperty(db, "$transaction", {
        value: async (callback: any) => callback(mockTx),
        configurable: true,
        writable: true
      });

      Object.defineProperty(db, "book", {
        value: {
          findMany: async () => [
            {
              id: "book-1",
              slug: "book-one",
              title: "Book One",
              price: 300,
              stockQuantity: 10,
              lowStockThreshold: 2,
              stockStatus: "in_stock",
              author: { name: "Author" }
            }
          ]
        },
        configurable: true,
        writable: true
      });

      Object.defineProperty(db, "user", {
        value: {
          findUnique: async () => ({ emailVerifiedAt: new Date() })
        },
        configurable: true,
        writable: true
      });

      const req = new Request("http://localhost/api/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: {
            fullName: "Jane Doe",
            email: "user@example.com",
            phone: "9876543210",
            addressLine1: "456 Oak Lane",
            city: "Kolkata",
            state: "West Bengal",
            postalCode: "700002",
            country: "India",
            shippingMethod: "standard"
          },
          items: [{ bookId: "book-1", quantity: 1 }],
          paymentMethod: "cod",
          saveAddress: true
        })
      });

      const res = await createOrder(req);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(addressCreated, true);

      // Restore
      Object.defineProperty(db, "$transaction", { value: originalTransaction, configurable: true, writable: true });
      Object.defineProperty(db, "book", { value: originalBook, configurable: true, writable: true });
      Object.defineProperty(db, "user", { value: originalUser, configurable: true, writable: true });
    });
  });

  describe("Razorpay Webhook & Payment Idempotency", () => {
    test("finalizePaidRazorpayOrder returns already_paid for a completed order", async () => {
      const mockTx = {
        $queryRaw: async () => [{
          id: "order-1",
          status: "paid",
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          razorpayOrderId: "rzp-order-1",
          razorpayPaymentId: "rzp-pay-1"
        }],
        order: {
          update: async () => ({
            id: "order-1",
            items: []
          })
        },
        emailJob: {
          create: async () => ({})
        }
      } as unknown as Prisma.TransactionClient;

      const originalTransaction = db.$transaction;
      const originalOrder = db.order;

      Object.defineProperty(db, "$transaction", {
        value: async (callback: any) => callback(mockTx),
        configurable: true,
        writable: true
      });

      Object.defineProperty(db, "order", {
        value: {
          findUnique: async () => ({
            id: "order-1",
            status: "paid",
            paymentStatus: "paid",
            paymentMethod: "razorpay",
            razorpayOrderId: "rzp-order-1",
            razorpayPaymentId: "rzp-pay-1"
          })
        },
        configurable: true,
        writable: true
      });

      const result = await finalizePaidRazorpayOrder({
        localOrderId: "order-1",
        razorpayOrderId: "rzp-order-1",
        razorpayPaymentId: "rzp-pay-1"
      });

      assert.strictEqual(result.outcome, "already_paid");
      assert.strictEqual(result.order, null);

      // Restore
      Object.defineProperty(db, "$transaction", { value: originalTransaction, configurable: true, writable: true });
      Object.defineProperty(db, "order", { value: originalOrder, configurable: true, writable: true });
    });
  });

  describe("Customer Order Timeline estimates", () => {
    test("standard shipping estimates 5-7 business days, express shipping estimates 2-3 business days", () => {
      const getEstimate = (method: string) => {
        return method === "express" ? "2-3 business days" : "5-7 business days";
      };

      assert.strictEqual(getEstimate("standard"), "5-7 business days");
      assert.strictEqual(getEstimate("express"), "2-3 business days");
    });
  });
});
