import { test, describe } from "node:test";
import assert from "node:assert";
import { getShippingQuote, isIndiaShippingCountry } from "../lib/shipping";

describe("Shipping Logic", () => {
  test("isIndiaShippingCountry verifies correct host countries", () => {
    assert.strictEqual(isIndiaShippingCountry("India"), true);
    assert.strictEqual(isIndiaShippingCountry("INDIA"), true);
    assert.strictEqual(isIndiaShippingCountry(" Bharat "), true);
    assert.strictEqual(isIndiaShippingCountry("USA"), false);
    assert.strictEqual(isIndiaShippingCountry(null), false);
    assert.strictEqual(isIndiaShippingCountry(undefined), false);
  });

  test("getShippingQuote returns unserviceable for non-India countries", () => {
    const quote = getShippingQuote({ country: "USA", subtotalAmount: 1500 });
    assert.strictEqual(quote.serviceable, false);
    assert.strictEqual(quote.shippingAmount, 0);
    assert.strictEqual(quote.code, "manual_quote");
  });

  test("getShippingQuote applies standard flat rate for India under threshold", () => {
    const quote = getShippingQuote({ country: "India", subtotalAmount: 500 });
    assert.strictEqual(quote.serviceable, true);
    assert.strictEqual(quote.shippingAmount, 70);
    assert.strictEqual(quote.code, "india_standard");
  });

  test("getShippingQuote applies free shipping for India at or over threshold", () => {
    const quoteAtThreshold = getShippingQuote({ country: "India", subtotalAmount: 999 });
    assert.strictEqual(quoteAtThreshold.serviceable, true);
    assert.strictEqual(quoteAtThreshold.shippingAmount, 0);
    assert.strictEqual(quoteAtThreshold.code, "india_free");

    const quoteOverThreshold = getShippingQuote({ country: "India", subtotalAmount: 1200 });
    assert.strictEqual(quoteOverThreshold.serviceable, true);
    assert.strictEqual(quoteOverThreshold.shippingAmount, 0);
    assert.strictEqual(quoteOverThreshold.code, "india_free");
  });

  test("getShippingQuote applies express flat rate regardless of threshold", () => {
    const quoteUnder = getShippingQuote({ country: "India", subtotalAmount: 500, shippingMethod: "express" });
    assert.strictEqual(quoteUnder.serviceable, true);
    assert.strictEqual(quoteUnder.shippingAmount, 150);
    assert.strictEqual(quoteUnder.code, "india_express");

    const quoteOver = getShippingQuote({ country: "India", subtotalAmount: 1200, shippingMethod: "express" });
    assert.strictEqual(quoteOver.serviceable, true);
    assert.strictEqual(quoteOver.shippingAmount, 150);
    assert.strictEqual(quoteOver.code, "india_express");
  });
});
