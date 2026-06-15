import { test, describe } from "node:test";
import assert from "node:assert";
import {
  normalizeStockQuantity,
  normalizeLowStockThreshold,
  getDerivedStockStatus,
  getEffectiveStockStatus,
  isBookAvailableForSale,
  getStockStatusLabel,
  DEFAULT_STOCK_QUANTITY,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from "../lib/inventory";
import type { StockStatus } from "../generated/prisma/client";

describe("Inventory Logic", () => {
  describe("normalizeStockQuantity", () => {
    test("returns DEFAULT_STOCK_QUANTITY for null or undefined", () => {
      assert.strictEqual(normalizeStockQuantity(null), DEFAULT_STOCK_QUANTITY);
      assert.strictEqual(normalizeStockQuantity(undefined), DEFAULT_STOCK_QUANTITY);
      assert.strictEqual(normalizeStockQuantity(), DEFAULT_STOCK_QUANTITY);
    });

    test("returns DEFAULT_STOCK_QUANTITY for non-numbers and NaN", () => {
      assert.strictEqual(normalizeStockQuantity(NaN), DEFAULT_STOCK_QUANTITY);
      // @ts-expect-error - testing invalid input types
      assert.strictEqual(normalizeStockQuantity("15"), DEFAULT_STOCK_QUANTITY);
    });

    test("floors fractional numbers", () => {
      assert.strictEqual(normalizeStockQuantity(5.7), 5);
      assert.strictEqual(normalizeStockQuantity(0.2), 0);
    });

    test("clamps negative numbers to 0", () => {
      assert.strictEqual(normalizeStockQuantity(-5), 0);
      assert.strictEqual(normalizeStockQuantity(-0.1), 0);
    });

    test("returns correct integer value for positive integers", () => {
      assert.strictEqual(normalizeStockQuantity(10), 10);
      assert.strictEqual(normalizeStockQuantity(0), 0);
    });
  });

  describe("normalizeLowStockThreshold", () => {
    test("returns DEFAULT_LOW_STOCK_THRESHOLD for null or undefined", () => {
      assert.strictEqual(normalizeLowStockThreshold(null), DEFAULT_LOW_STOCK_THRESHOLD);
      assert.strictEqual(normalizeLowStockThreshold(undefined), DEFAULT_LOW_STOCK_THRESHOLD);
      assert.strictEqual(normalizeLowStockThreshold(), DEFAULT_LOW_STOCK_THRESHOLD);
    });

    test("returns DEFAULT_LOW_STOCK_THRESHOLD for non-numbers and NaN", () => {
      assert.strictEqual(normalizeLowStockThreshold(NaN), DEFAULT_LOW_STOCK_THRESHOLD);
      // @ts-expect-error - testing invalid input types
      assert.strictEqual(normalizeLowStockThreshold("2"), DEFAULT_LOW_STOCK_THRESHOLD);
    });

    test("floors fractional numbers and clamps negative numbers", () => {
      assert.strictEqual(normalizeLowStockThreshold(2.9), 2);
      assert.strictEqual(normalizeLowStockThreshold(-1), 0);
    });

    test("returns correct integer value", () => {
      assert.strictEqual(normalizeLowStockThreshold(5), 5);
      assert.strictEqual(normalizeLowStockThreshold(0), 0);
    });
  });

  describe("getDerivedStockStatus", () => {
    test("returns out_of_stock when quantity is 0 or less", () => {
      assert.strictEqual(getDerivedStockStatus(0, 3), "out_of_stock");
      assert.strictEqual(getDerivedStockStatus(-1, 3), "out_of_stock");
    });

    test("returns low_stock when quantity is below or equal to threshold", () => {
      assert.strictEqual(getDerivedStockStatus(3, 3), "low_stock");
      assert.strictEqual(getDerivedStockStatus(2, 3), "low_stock");
      assert.strictEqual(getDerivedStockStatus(1, 3), "low_stock");
    });

    test("returns in_stock when quantity is above threshold", () => {
      assert.strictEqual(getDerivedStockStatus(4, 3), "in_stock");
      assert.strictEqual(getDerivedStockStatus(10, 3), "in_stock");
    });
  });

  describe("getEffectiveStockStatus", () => {
    test("returns explicit stockStatus if provided, bypassing derivation", () => {
      assert.strictEqual(
        getEffectiveStockStatus({ stockQuantity: 0, stockStatus: "in_stock" }),
        "in_stock"
      );
      assert.strictEqual(
        getEffectiveStockStatus({ stockQuantity: 15, stockStatus: "out_of_stock" }),
        "out_of_stock"
      );
    });

    test("derives stockStatus when not explicitly provided", () => {
      assert.strictEqual(
        getEffectiveStockStatus({ stockQuantity: 0 }),
        "out_of_stock"
      );
      assert.strictEqual(
        getEffectiveStockStatus({ stockQuantity: 2, lowStockThreshold: 3 }),
        "low_stock"
      );
      assert.strictEqual(
        getEffectiveStockStatus({ stockQuantity: 10, lowStockThreshold: 3 }),
        "in_stock"
      );
    });
  });

  describe("isBookAvailableForSale", () => {
    test("returns false if price is missing or invalid", () => {
      assert.strictEqual(isBookAvailableForSale({ price: null, stockQuantity: 10 }), false);
      assert.strictEqual(isBookAvailableForSale({ price: undefined, stockQuantity: 10 }), false);
      assert.strictEqual(isBookAvailableForSale({ price: 0, stockQuantity: 10 }), false);
      assert.strictEqual(isBookAvailableForSale({ price: -5, stockQuantity: 10 }), false);
    });

    test("returns false if quantity is 0 or status is out_of_stock", () => {
      assert.strictEqual(isBookAvailableForSale({ price: 299, stockQuantity: 0 }), false);
      assert.strictEqual(
        isBookAvailableForSale({ price: 299, stockQuantity: 10, stockStatus: "out_of_stock" }),
        false
      );
    });

    test("returns true if price > 0, stockQuantity > 0, and status is not out_of_stock", () => {
      assert.strictEqual(isBookAvailableForSale({ price: 299, stockQuantity: 10 }), true);
      assert.strictEqual(
        isBookAvailableForSale({ price: 299, stockQuantity: 2, lowStockThreshold: 3 }),
        true
      );
      assert.strictEqual(
        isBookAvailableForSale({ price: 299, stockQuantity: 5, stockStatus: "in_stock" }),
        true
      );
    });
  });

  describe("getStockStatusLabel", () => {
    test("returns correct human-readable label", () => {
      assert.strictEqual(getStockStatusLabel("in_stock"), "In stock");
      assert.strictEqual(getStockStatusLabel("low_stock"), "Low stock");
      assert.strictEqual(getStockStatusLabel("out_of_stock"), "Out of stock");
    });
  });
});
