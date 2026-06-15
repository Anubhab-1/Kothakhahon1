import type { Order, OrderItem, PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { formatDisplayDate } from "@/lib/date";
import { getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/orders";
import { formatINR } from "@/lib/utils";

export type InvoiceOrderRecord = Order & {
  items: OrderItem[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPaymentSummary(method: PaymentMethod, status: PaymentStatus) {
  return `${getPaymentMethodLabel(method)} / ${getPaymentStatusLabel(status)}`;
}

export function buildInvoiceNumber(orderId: string, createdAt: Date) {
  return `KKH-${createdAt.getUTCFullYear()}-${orderId.toUpperCase()}`;
}

export function buildInvoiceFilename(invoiceNumber: string) {
  return `${invoiceNumber.toLowerCase()}.html`;
}

function renderLineItems(items: OrderItem[]) {
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
              ${escapeHtml(order.customerName)}<br />
              ${escapeHtml(order.addressLine1)}<br />
              ${
                order.addressLine2
                  ? `${escapeHtml(order.addressLine2)}<br />`
                  : ""
              }
              ${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(
                order.postalCode,
              )}<br />
              ${escapeHtml(order.country)}
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
              ${renderLineItems(order.items)}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${escapeHtml(formatINR(order.subtotalAmount))}</span>
            </div>
            <div class="totals-row">
              <span>Shipping</span>
              <span>${escapeHtml(formatINR(order.shippingAmount))}</span>
            </div>
            <div class="totals-row">
              <strong>Total</strong>
              <strong>${escapeHtml(formatINR(order.totalAmount))}</strong>
            </div>
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
