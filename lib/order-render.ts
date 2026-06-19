import type { Order, OrderItem } from "@/generated/prisma/client";
import { escapeHtml, formatINR } from "@/lib/utils";

export function renderOrderItemsMarkup(items: OrderItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#1c1713;">
            <strong>${escapeHtml(item.bookTitle)}</strong><br />
            <span style="color:#6b5a47;">${escapeHtml(item.bookAuthor)}</span>
          </td>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#6b5a47;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#1c1713;text-align:right;">${escapeHtml(formatINR(item.price * item.quantity))}</td>
        </tr>`,
    )
    .join("");
}

export function renderInvoiceLineItems(items: OrderItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.bookTitle)}</td>
          <td>${escapeHtml(item.bookAuthor)}</td>
          <td>${item.quantity}</td>
          <td>${escapeHtml(formatINR(item.price))}</td>
          <td>${escapeHtml(formatINR(item.price * item.quantity))}</td>
        </tr>`,
    )
    .join("");
}

export function calculateShippingGst(order: Order) {
  const isWestBengal = order.state?.trim().toLowerCase() === "west bengal";
  const shippingGstTotal = order.shippingAmount - (order.shippingAmount / 1.18);
  const cgst = isWestBengal ? shippingGstTotal / 2 : 0;
  const sgst = isWestBengal ? shippingGstTotal / 2 : 0;
  const igst = !isWestBengal ? shippingGstTotal : 0;
  return { cgst, sgst, igst, total: shippingGstTotal };
}

export function renderTotalsMarkup(order: Order) {
  let discountRow = "";
  if (order.discountAmount > 0) {
    const couponInfo = order.couponCode ? ` (${order.couponCode})` : "";
    discountRow = `
      <tr>
        <td colspan="2" style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#6b5a47;text-align:right;">Discount${escapeHtml(couponInfo)}:</td>
        <td style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#1c1713;text-align:right;">-${escapeHtml(formatINR(order.discountAmount))}</td>
      </tr>`;
  }

  const gst = calculateShippingGst(order);
  let gstRows = "";
  if (order.shippingAmount > 0) {
    if (gst.cgst > 0) {
      gstRows += `
        <tr>
          <td colspan="2" style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#6b5a47;text-align:right;">CGST @ 9% (on shipping):</td>
          <td style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#1c1713;text-align:right;">${escapeHtml(formatINR(gst.cgst))}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#6b5a47;text-align:right;">SGST @ 9% (on shipping):</td>
          <td style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#1c1713;text-align:right;">${escapeHtml(formatINR(gst.sgst))}</td>
        </tr>`;
    } else {
      gstRows += `
        <tr>
          <td colspan="2" style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#6b5a47;text-align:right;">IGST @ 18% (on shipping):</td>
          <td style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#1c1713;text-align:right;">${escapeHtml(formatINR(gst.igst))}</td>
        </tr>`;
    }
    gstRows += `
      <tr>
        <td colspan="2" style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#6b5a47;text-align:right;">Books GST (Exempt @ 0%):</td>
        <td style="padding:6px 0;border-top:1px solid #eadfce;font-size:13px;color:#1c1713;text-align:right;">₹ 0.00</td>
      </tr>`;
  }

  return `
    <tr>
      <td colspan="2" style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#6b5a47;text-align:right;">Subtotal:</td>
      <td style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#1c1713;text-align:right;">${escapeHtml(formatINR(order.subtotalAmount))}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#6b5a47;text-align:right;">Shipping (${order.shippingMethod}):</td>
      <td style="padding:8px 0;border-top:1px solid #eadfce;font-size:14px;color:#1c1713;text-align:right;">${escapeHtml(formatINR(order.shippingAmount))}</td>
    </tr>
    ${gstRows}
    ${discountRow}
    <tr>
      <td colspan="2" style="padding:10px 0;border-top:2px solid #8f7345;font-size:16px;font-weight:bold;color:#1c1713;text-align:right;">Total:</td>
      <td style="padding:10px 0;border-top:2px solid #8f7345;font-size:16px;font-weight:bold;color:#1c1713;text-align:right;">${escapeHtml(formatINR(order.totalAmount))}</td>
    </tr>`;
}

export function renderInvoiceTotalsHtml(order: Order) {
  let discountRow = "";
  if (order.discountAmount > 0) {
    const couponInfo = order.couponCode ? ` (${escapeHtml(order.couponCode)})` : "";
    discountRow = `<div class="totals-row">
      <span>Discount${couponInfo}</span>
      <span>-${escapeHtml(formatINR(order.discountAmount))}</span>
    </div>`;
  }

  const gst = calculateShippingGst(order);
  let gstRows = "";
  if (order.shippingAmount > 0) {
    if (gst.cgst > 0) {
      gstRows += `
        <div class="totals-row" style="font-size:13px;color:#6b5a47;">
          <span>CGST @ 9% (on shipping)</span>
          <span>${escapeHtml(formatINR(gst.cgst))}</span>
        </div>
        <div class="totals-row" style="font-size:13px;color:#6b5a47;">
          <span>SGST @ 9% (on shipping)</span>
          <span>${escapeHtml(formatINR(gst.sgst))}</span>
        </div>`;
    } else {
      gstRows += `
        <div class="totals-row" style="font-size:13px;color:#6b5a47;">
          <span>IGST @ 18% (on shipping)</span>
          <span>${escapeHtml(formatINR(gst.igst))}</span>
        </div>`;
    }
    gstRows += `
      <div class="totals-row" style="font-size:13px;color:#6b5a47;">
        <span>Books GST (Exempt @ 0%)</span>
        <span>₹ 0.00</span>
      </div>`;
  }

  return `
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${escapeHtml(formatINR(order.subtotalAmount))}</span>
    </div>
    <div class="totals-row">
      <span>Shipping</span>
      <span>${escapeHtml(formatINR(order.shippingAmount))}</span>
    </div>
    ${gstRows}
    ${discountRow}
    <div class="totals-row">
      <strong>Total</strong>
      <strong>${escapeHtml(formatINR(order.totalAmount))}</strong>
    </div>`;
}

export function renderShippingAddress(order: Order) {
  return `${escapeHtml(order.customerName)}<br />
${escapeHtml(order.addressLine1)}<br />
${
  order.addressLine2
    ? `${escapeHtml(order.addressLine2)}<br />`
    : ""
}
${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.postalCode)}<br />
${escapeHtml(order.country)}`;
}

export function renderInvoiceShippingAddress(order: Order) {
  return `${escapeHtml(order.customerName)}<br />
${escapeHtml(order.addressLine1)}<br />
${
  order.addressLine2
    ? `${escapeHtml(order.addressLine2)}<br />`
    : ""
}
${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.postalCode)}<br />
${escapeHtml(order.country)}`;
}
