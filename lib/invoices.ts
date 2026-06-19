import type { Order, OrderItem, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { formatDisplayDate } from "@/lib/date";
import { getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/orders";
import { formatINR, escapeHtml } from "@/lib/utils";
import {
  renderInvoiceLineItems,
  renderInvoiceTotalsHtml,
  renderInvoiceShippingAddress,
  calculateShippingGst,
} from "@/lib/order-render";
import { jsPDF } from "jspdf";

type InvoiceOrderRecord = Order & {
  items: OrderItem[];
};

function formatPaymentSummary(method: PaymentMethod, status: PaymentStatus) {
  return `${getPaymentMethodLabel(method)} / ${getPaymentStatusLabel(status)}`;
}

export function buildInvoiceNumber(orderId: string, createdAt: Date) {
  return `KKH-${createdAt.getUTCFullYear()}-${orderId.toUpperCase()}`;
}

export function buildInvoiceFilename(invoiceNumber: string) {
  return `${invoiceNumber.toLowerCase()}.pdf`;
}

export function renderInvoiceHtml(order: InvoiceOrderRecord) {
  const invoiceNumber =
    order.invoiceNumber ?? buildInvoiceNumber(order.id, order.createdAt);
  const invoiceIssuedAt = order.invoiceIssuedAt ?? order.createdAt;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(invoiceNumber)}</title>
    <style>
      body {
        margin: 0;
        background: #f5efe5;
        color: #1c1713;
        font-family: Georgia, serif;
      }
      .sheet {
        max-width: 920px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }
      .card {
        background: #fffaf3;
        border: 1px solid #dcc7a2;
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 18px 48px rgba(28, 23, 19, 0.08);
      }
      .hero {
        padding: 24px 28px;
        background: linear-gradient(135deg, #1c1713, #33281f);
        color: #f5efe5;
      }
      .hero small {
        display: block;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #d8a84b;
        font-size: 11px;
      }
      .hero h1 {
        margin: 12px 0 0;
        font-size: 34px;
        line-height: 1.1;
      }
      .body {
        padding: 28px;
      }
      .grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .panel {
        border: 1px solid #eadfce;
        border-radius: 18px;
        background: #fff;
        padding: 18px;
      }
      .label {
        margin: 0 0 6px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #8f7345;
        font-size: 11px;
      }
      .value {
        margin: 0;
        font-size: 16px;
        line-height: 1.6;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 24px;
      }
      th, td {
        border-top: 1px solid #eadfce;
        padding: 12px 10px;
        text-align: left;
        vertical-align: top;
        font-size: 15px;
      }
      th {
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #8f7345;
        font-size: 11px;
      }
      .totals {
        margin-top: 24px;
        margin-left: auto;
        width: min(100%, 320px);
      }
      .totals-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 0;
        border-top: 1px solid #eadfce;
      }
      .totals-row strong {
        font-size: 20px;
      }
      .footer {
        margin-top: 28px;
        padding-top: 18px;
        border-top: 1px solid #eadfce;
        color: #6b5a47;
        font-size: 13px;
        line-height: 1.7;
      }
      @media print {
        body {
          background: #fff;
        }
        .sheet {
          padding: 0;
        }
        .card {
          box-shadow: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <section class="card">
        <header class="hero">
          <small>Kothakhahon Prokashoni</small>
          <h1>Order Invoice</h1>
        </header>
        <section class="body">
          <div class="grid">
            <article class="panel">
              <p class="label">Invoice Number</p>
              <p class="value">${escapeHtml(invoiceNumber)}</p>
              <p class="label">Issued On</p>
              <p class="value">${escapeHtml(
                formatDisplayDate(invoiceIssuedAt.toISOString(), "Unknown"),
              )}</p>
              <p class="label">Order Reference</p>
              <p class="value">${escapeHtml(order.id)}</p>
            </article>
            <article class="panel">
              <p class="label">Order Status</p>
              <p class="value">${escapeHtml(getOrderStatusLabel(order.status))}</p>
              <p class="label">Payment</p>
              <p class="value">${escapeHtml(
                formatPaymentSummary(order.paymentMethod, order.paymentStatus),
              )}</p>
              <p class="label">Customer</p>
              <p class="value">${escapeHtml(order.customerName)}<br />${escapeHtml(
                order.customerEmail,
              )}<br />${escapeHtml(order.customerPhone)}</p>
            </article>
          </div>

          <article class="panel" style="margin-top: 18px;">
            <p class="label">Billing And Shipping Address</p>
            <p class="value">
              ${renderInvoiceShippingAddress(order)}
            </p>
          </article>

          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${renderInvoiceLineItems(order.items)}
            </tbody>
          </table>

          <div class="totals">
            ${renderInvoiceTotalsHtml(order)}
          </div>

          <div class="footer">
            This invoice was generated from the Kothakhahon order system for reader support,
            order tracking, and fulfillment reference.
          </div>
        </section>
      </section>
    </main>
  </body>
</html>`;
}

export function generateInvoicePdf(order: InvoiceOrderRecord): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const invoiceNumber = order.invoiceNumber ?? buildInvoiceNumber(order.id, order.createdAt);
  const invoiceIssuedAt = order.invoiceIssuedAt ?? order.createdAt;

  // Title / Brand Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(28, 23, 19); // void/dark
  doc.text("Kothakhahon Prokashoni", 20, 20);

  doc.setFontSize(14);
  doc.setTextColor(143, 115, 69); // gold
  doc.text("ORDER INVOICE", 20, 28);

  // Line separator
  doc.setDrawColor(220, 199, 162); // gold border
  doc.line(20, 32, 190, 32);

  // Left column - Invoice Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 90, 71); // stone
  doc.text("INVOICE NUMBER:", 20, 42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(invoiceNumber, 20, 47);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 90, 71);
  doc.text("ISSUED ON:", 20, 55);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(formatDisplayDate(invoiceIssuedAt.toISOString(), "Unknown"), 20, 60);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 90, 71);
  doc.text("ORDER REFERENCE:", 20, 68);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(order.id, 20, 73);

  // Right column - Customer Info
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 90, 71);
  doc.text("CUSTOMER:", 120, 42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(order.customerName, 120, 47);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerEmail, 120, 52);
  doc.text(order.customerPhone, 120, 57);

  doc.setTextColor(107, 90, 71);
  doc.text("PAYMENT STATUS:", 120, 65);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(`${getPaymentMethodLabel(order.paymentMethod)} - ${getPaymentStatusLabel(order.paymentStatus)}`, 120, 70);

  // Shipping details
  doc.setDrawColor(234, 223, 206);
  doc.line(20, 78, 190, 78);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 90, 71);
  doc.text("SHIPPING ADDRESS:", 20, 85);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 23, 19);
  doc.text(order.customerName, 20, 90);
  doc.setFont("helvetica", "normal");
  doc.text(order.addressLine1, 20, 95);
  let yOffset = 100;
  if (order.addressLine2) {
    doc.text(order.addressLine2, 20, yOffset);
    yOffset += 5;
  }
  doc.text(`${order.city}, ${order.state} - ${order.postalCode}`, 20, yOffset);
  doc.text(order.country, 20, yOffset + 5);

  yOffset += 15;

  // Table header
  doc.setFillColor(28, 23, 19); // void header background
  doc.rect(20, yOffset, 170, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(245, 239, 229);
  doc.text("TITLE", 23, yOffset + 5.5);
  doc.text("AUTHOR", 85, yOffset + 5.5);
  doc.text("QTY", 130, yOffset + 5.5);
  doc.text("PRICE", 145, yOffset + 5.5);
  doc.text("TOTAL", 170, yOffset + 5.5);

  yOffset += 12;

  // Table items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(28, 23, 19);

  for (const item of order.items) {
    const title = item.bookTitle.length > 32 ? item.bookTitle.slice(0, 30) + "..." : item.bookTitle;
    const author = item.bookAuthor.length > 20 ? item.bookAuthor.slice(0, 18) + "..." : item.bookAuthor;

    doc.text(title, 23, yOffset);
    doc.text(author, 85, yOffset);
    doc.text(String(item.quantity), 132, yOffset);
    doc.text(formatINR(item.price), 145, yOffset);
    doc.text(formatINR(item.price * item.quantity), 170, yOffset);

    // Draw bottom border under item row
    doc.setDrawColor(234, 223, 206);
    doc.line(20, yOffset + 3, 190, yOffset + 3);

    yOffset += 8;
  }

  yOffset += 4;

  // Totals calculations
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 90, 71);

  doc.text("Subtotal:", 135, yOffset);
  doc.setTextColor(28, 23, 19);
  doc.text(formatINR(order.subtotalAmount), 170, yOffset);

  yOffset += 6;
  doc.setTextColor(107, 90, 71);
  doc.text(`Shipping (${order.shippingMethod} estimate):`, 115, yOffset);
  doc.setTextColor(28, 23, 19);
  doc.text(formatINR(order.shippingAmount), 170, yOffset);

  const gst = calculateShippingGst(order);
  if (order.shippingAmount > 0) {
    if (gst.cgst > 0) {
      yOffset += 6;
      doc.setTextColor(107, 90, 71);
      doc.text("CGST @ 9% (on shipping):", 115, yOffset);
      doc.setTextColor(28, 23, 19);
      doc.text(formatINR(gst.cgst), 170, yOffset);

      yOffset += 6;
      doc.setTextColor(107, 90, 71);
      doc.text("SGST @ 9% (on shipping):", 115, yOffset);
      doc.setTextColor(28, 23, 19);
      doc.text(formatINR(gst.sgst), 170, yOffset);
    } else {
      yOffset += 6;
      doc.setTextColor(107, 90, 71);
      doc.text("IGST @ 18% (on shipping):", 115, yOffset);
      doc.setTextColor(28, 23, 19);
      doc.text(formatINR(gst.igst), 170, yOffset);
    }

    yOffset += 6;
    doc.setTextColor(107, 90, 71);
    doc.text("Books GST (Exempt @ 0%):", 115, yOffset);
    doc.setTextColor(28, 23, 19);
    doc.text("Rs. 0.00", 170, yOffset);
  }

  if (order.discountAmount > 0) {
    yOffset += 6;
    doc.setTextColor(107, 90, 71);
    doc.text(`Discount (${order.couponCode ?? "Coupon"}):`, 120, yOffset);
    doc.setTextColor(28, 23, 19);
    doc.text(`-${formatINR(order.discountAmount)}`, 170, yOffset);
  }

  yOffset += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 23, 19);
  doc.text("Total:", 135, yOffset);
  doc.text(formatINR(order.totalAmount), 170, yOffset);

  // Footer note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 90, 71);
  doc.text("Thank you for your order. For support, contact the Kothakhahon editorial desk.", 20, 270);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
