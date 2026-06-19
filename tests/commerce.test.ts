import { describe, test } from "node:test";
import assert from "node:assert";
import { calculateCouponDiscount } from "../lib/coupons";
import { getStockAdjustmentData } from "../lib/order-inventory";

describe("Commerce Accounting", () => {
  describe("calculateCouponDiscount", () => {
    test("calculates percentage discounts rounded to rupees", () => {
      assert.strictEqual(
        calculateCouponDiscount({ type: "percent", value: 10, subtotalAmount: 455 }),
        46,
      );
    });

    test("caps flat discounts at subtotal", () => {
      assert.strictEqual(
        calculateCouponDiscount({ type: "flat", value: 500, subtotalAmount: 350 }),
        350,
      );
    });

    test("sanitizes invalid discount values", () => {
      assert.strictEqual(
        calculateCouponDiscount({ type: "flat", value: Number.NaN, subtotalAmount: 350 }),
        0,
      );
      assert.strictEqual(
        calculateCouponDiscount({ type: "percent", value: -10, subtotalAmount: 350 }),
        0,
      );
    });
  });

  describe("getStockAdjustmentData", () => {
    test("includes soldCount increment only when sale quantity is positive", () => {
      assert.deepStrictEqual(getStockAdjustmentData({
        nextQuantity: 7,
        lowStockThreshold: 3,
        soldQuantity: 2,
      }), {
        stockQuantity: 7,
        stockStatus: "in_stock",
        soldCount: { increment: 2 },
      });

      assert.deepStrictEqual(getStockAdjustmentData({
        nextQuantity: 7,
        lowStockThreshold: 3,
      }), {
        stockQuantity: 7,
        stockStatus: "in_stock",
      });
    });
  });
});
