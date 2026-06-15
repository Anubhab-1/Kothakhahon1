export const INDIA_STANDARD_SHIPPING_AMOUNT = 70;
export const INDIA_FREE_SHIPPING_THRESHOLD = 999;

export type ShippingQuote = {
  serviceable: boolean;
  shippingAmount: number;
  code: "india_standard" | "india_free" | "manual_quote";
  label: string;
  message: string;
};

function normalizeCountry(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function isIndiaShippingCountry(value?: string | null) {
  const normalized = normalizeCountry(value);
  return normalized === "india" || normalized === "bharat";
}

export function getShippingQuote(options: {
  country?: string | null;
  subtotalAmount: number;
}): ShippingQuote {
  if (!isIndiaShippingCountry(options.country)) {
    return {
      serviceable: false,
      shippingAmount: 0,
      code: "manual_quote",
      label: "Manual quote required",
      message:
        "Direct checkout currently supports India shipping only. Contact the editorial desk for international orders.",
    };
  }

  if (options.subtotalAmount >= INDIA_FREE_SHIPPING_THRESHOLD) {
    return {
      serviceable: true,
      shippingAmount: 0,
      code: "india_free",
      label: "Free shipping",
      message: `Orders of Rs. ${INDIA_FREE_SHIPPING_THRESHOLD} or more ship free within India.`,
    };
  }

  return {
    serviceable: true,
    shippingAmount: INDIA_STANDARD_SHIPPING_AMOUNT,
    code: "india_standard",
    label: "Standard India shipping",
    message: `A flat Rs. ${INDIA_STANDARD_SHIPPING_AMOUNT} shipping fee applies to India orders below Rs. ${INDIA_FREE_SHIPPING_THRESHOLD}.`,
  };
}
