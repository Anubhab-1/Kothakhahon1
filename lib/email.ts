import { Resend } from "resend";
import type {
  ContactMessage,
  ManuscriptSubmission,
  NewsletterSubscriber,
  Order,
  OrderItem,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env, getSiteUrlString } from "@/lib/env";
import { getPaymentMethodLabel } from "@/lib/orders";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const INTERNET_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailSendError";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatParagraphs(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function normalizeRecipients(value?: string | string[] | null) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      values
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => INTERNET_EMAIL_PATTERN.test(entry)),
    ),
  );
}

function getMailSender() {
  if (env.RESEND_FROM_EMAIL?.trim()) {
    return env.RESEND_FROM_EMAIL.trim();
  }

  if (process.env.NODE_ENV !== "production" && env.RESEND_API_KEY) {
    return "Kothakhahon <onboarding@resend.dev>";
  }

  return null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function renderEmailShell({
  eyebrow,
  title,
  body,
  footer,
}: {
  eyebrow: string;
  title: string;
  body: string;
  footer?: string;
}) {
  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f5efe5;color:#1c1713;font-family:Georgia,serif;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
        <div style="border:1px solid #dcc7a2;border-radius:28px;overflow:hidden;background:#fffaf3;box-shadow:0 18px 48px rgba(28,23,19,0.08);">
          <div style="padding:16px 24px;background:linear-gradient(135deg,#1c1713,#33281f);color:#f5efe5;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#d8a84b;">${escapeHtml(eyebrow)}</div>
            <h1 style="margin:10px 0 0;font-size:34px;line-height:1.1;font-weight:600;">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:24px;">
            ${body}
            <hr style="border:none;border-top:1px solid #eadfce;margin:24px 0;" />
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b5a47;">
              ${escapeHtml(footer ?? `Kothakhahon Prokashoni - ${getSiteUrlString()}`)}
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function renderDefinitionList(rows: Array<{ label: string; value: string }>) {
  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0;">
      <tbody>
        ${rows
          .map(
            ({ label, value }) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8f7345;width:180px;">${escapeHtml(label)}</td>
                <td style="padding:8px 0;vertical-align:top;font-size:16px;line-height:1.6;color:#1c1713;">${value}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function getAdminNotificationRecipients() {
  const fromEnv = normalizeRecipients(env.ADMIN_NOTIFICATION_EMAIL);
  if (fromEnv.length > 0) {
    return fromEnv;
  }

  const adminUsers = await db.user.findMany({
    where: {
      isActive: true,
      role: "ADMIN",
    },
    select: {
      email: true,
    },
  });

  return normalizeRecipients(adminUsers.map((admin) => admin.email));
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
}) {
  if (!resend) {
    throw new EmailSendError("Resend API key is not configured.");
  }

  const sender = getMailSender();
  if (!sender) {
    throw new EmailSendError("Resend sender email is not configured.");
  }

  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    throw new EmailSendError("Email recipient list is empty.");
  }

  const replyToRecipients = normalizeRecipients(replyTo);
  const { data, error } = await resend.emails.send({
    from: sender,
    to: recipients,
    subject,
    html,
    replyTo: replyToRecipients.length > 0 ? replyToRecipients : undefined,
  });

  if (error) {
    throw new EmailSendError(
      typeof error.message === "string" ? error.message : "Resend email send failed.",
    );
  }

  return { sent: true, id: data?.id ?? null } as const;
}

async function sendAdminEmail({
  subject,
  html,
  replyTo,
}: {
  subject: string;
  html: string;
  replyTo?: string | string[];
}) {
  const adminRecipients = await getAdminNotificationRecipients();
  if (adminRecipients.length === 0) {
    return { skipped: true as const, reason: "missing_admin_recipients" as const };
  }

  return sendEmail({
    to: adminRecipients,
    subject,
    html,
    replyTo,
  });
}

function renderOrderItemsMarkup(items: OrderItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#1c1713;">
            <strong>${escapeHtml(item.bookTitle)}</strong><br />
            <span style="color:#6b5a47;">${escapeHtml(item.bookAuthor)}</span>
          </td>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#6b5a47;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-top:1px solid #eadfce;font-size:15px;line-height:1.6;color:#1c1713;text-align:right;">${escapeHtml(formatCurrency(item.price * item.quantity))}</td>
        </tr>`,
    )
    .join("");
}

function renderShippingAddress(order: Order) {
  return formatParagraphs(
    `${order.customerName}\n${order.addressLine1}${order.addressLine2 ? `\n${order.addressLine2}` : ""}\n${order.city}, ${order.state} ${order.postalCode}\n${order.country}`,
  );
}

export async function sendContactSubmissionCustomerEmail(message: ContactMessage) {
  return sendEmail({
    to: message.email,
    subject: "We received your message",
    html: renderEmailShell({
      eyebrow: "Reader Inbox",
      title: `Thank you, ${message.fullName}`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Your message has reached the Kothakhahon team. We review inbox submissions carefully and usually reply within 2 to 3 business days.
        </p>
        ${renderDefinitionList([
          { label: "Department", value: escapeHtml(message.department) },
          { label: "Message", value: formatParagraphs(message.message) },
        ])}
      `,
    }),
  });
}

export async function sendContactSubmissionAdminEmail(message: ContactMessage) {
  return sendAdminEmail({
    replyTo: message.email,
    subject: `[Contact] ${message.department} - ${message.fullName}`,
    html: renderEmailShell({
      eyebrow: "Contact Submission",
      title: message.fullName,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          A new contact message has been submitted through the public site.
        </p>
        ${renderDefinitionList([
          { label: "Email", value: escapeHtml(message.email) },
          { label: "Department", value: escapeHtml(message.department) },
          { label: "Message", value: formatParagraphs(message.message) },
        ])}
      `,
    }),
  });
}

export async function sendContactSubmissionEmails(message: ContactMessage) {
  await Promise.all([
    sendContactSubmissionCustomerEmail(message),
    sendContactSubmissionAdminEmail(message),
  ]);
}

export async function sendManuscriptSubmissionCustomerEmail(
  submission: ManuscriptSubmission,
) {
  return sendEmail({
    to: submission.email,
    subject: "Your manuscript submission is in review",
    html: renderEmailShell({
      eyebrow: "Manuscript Desk",
      title: `Submission received for ${submission.manuscriptTitle}`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Thank you for trusting Kothakhahon with your work. Our editorial desk has received your submission and will review it against the current list and publishing program.
        </p>
        ${renderDefinitionList([
          { label: "Title", value: escapeHtml(submission.manuscriptTitle) },
          { label: "Genre", value: escapeHtml(submission.genre) },
          { label: "Language", value: escapeHtml(submission.language) },
          { label: "Word Count", value: escapeHtml(String(submission.wordCount)) },
        ])}
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#5b4a39;">
          If your project aligns with our list, we will reach out directly by email.
        </p>
      `,
    }),
  });
}

export async function sendManuscriptSubmissionAdminEmail(
  submission: ManuscriptSubmission,
) {
  return sendAdminEmail({
    replyTo: submission.email,
    subject: `[Manuscript] ${submission.manuscriptTitle} - ${submission.fullName}`,
    html: renderEmailShell({
      eyebrow: "New Manuscript",
      title: submission.manuscriptTitle,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          A new manuscript submission has arrived through the site.
        </p>
        ${renderDefinitionList([
          { label: "Author", value: escapeHtml(submission.fullName) },
          { label: "Email", value: escapeHtml(submission.email) },
          { label: "Phone", value: escapeHtml(submission.phone) },
          { label: "City", value: escapeHtml(submission.city) },
          { label: "Genre", value: escapeHtml(submission.genre) },
          { label: "Language", value: escapeHtml(submission.language) },
          { label: "Word Count", value: escapeHtml(String(submission.wordCount)) },
          { label: "Synopsis", value: formatParagraphs(submission.synopsis) },
        ])}
      `,
    }),
  });
}

export async function sendManuscriptSubmissionEmails(
  submission: ManuscriptSubmission,
) {
  await Promise.all([
    sendManuscriptSubmissionCustomerEmail(submission),
    sendManuscriptSubmissionAdminEmail(submission),
  ]);
}

export async function sendNewsletterSubscriptionCustomerEmail(
  subscriber: NewsletterSubscriber,
) {
  return sendEmail({
    to: subscriber.email,
    subject: "Welcome to the Kothakhahon reader list",
    html: renderEmailShell({
      eyebrow: "Reader Club",
      title: "Subscription confirmed",
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          You are now subscribed to Kothakhahon updates. We will send new releases, editorial notes, and occasional early chapter previews.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#5b4a39;">
          We keep the list focused and do not send unnecessary volume.
        </p>
      `,
    }),
  });
}

export async function sendNewsletterSubscriptionAdminEmail(
  subscriber: NewsletterSubscriber,
) {
  return sendAdminEmail({
    subject: `[Newsletter] New subscriber - ${subscriber.email}`,
    html: renderEmailShell({
      eyebrow: "Newsletter",
      title: "New subscriber added",
      body: renderDefinitionList([
        { label: "Subscriber", value: escapeHtml(subscriber.email) },
        { label: "Created", value: escapeHtml(subscriber.createdAt.toISOString()) },
      ]),
    }),
  });
}

export async function sendNewsletterSubscriptionEmails(
  subscriber: NewsletterSubscriber,
) {
  await Promise.all([
    sendNewsletterSubscriptionCustomerEmail(subscriber),
    sendNewsletterSubscriptionAdminEmail(subscriber),
  ]);
}

export async function sendCashOnDeliveryOrderCustomerEmail(
  order: Order & {
    items: OrderItem[];
  },
) {
  const orderLabel = order.id.slice(-8).toUpperCase();
  const itemsMarkup = renderOrderItemsMarkup(order.items);

  return sendEmail({
    to: order.customerEmail,
    subject: `Order received - ${orderLabel}`,
    html: renderEmailShell({
      eyebrow: "Cash On Delivery",
      title: `Order ${orderLabel} has been placed`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Your order has been reserved with cash on delivery. Payment will be collected when the parcel reaches you.
        </p>
        ${renderDefinitionList([
          { label: "Order", value: escapeHtml(orderLabel) },
          { label: "Payment Method", value: escapeHtml(getPaymentMethodLabel(order.paymentMethod)) },
          { label: "Amount Due", value: escapeHtml(formatCurrency(order.totalAmount)) },
          { label: "Shipping To", value: renderShippingAddress(order) },
        ])}
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Item</th>
              <th style="padding:0 0 8px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Qty</th>
              <th style="padding:0 0 8px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Line Total</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
      `,
    }),
  });
}

export async function sendCashOnDeliveryOrderAdminEmail(
  order: Order & {
    items: OrderItem[];
  },
) {
  const orderLabel = order.id.slice(-8).toUpperCase();
  const itemsMarkup = renderOrderItemsMarkup(order.items);

  return sendAdminEmail({
    replyTo: order.customerEmail,
    subject: `[COD Order] ${orderLabel} - ${order.customerName}`,
    html: renderEmailShell({
      eyebrow: "Cash On Delivery",
      title: `Order ${orderLabel} needs fulfillment`,
      body: `
        ${renderDefinitionList([
          { label: "Customer", value: escapeHtml(order.customerName) },
          { label: "Email", value: escapeHtml(order.customerEmail) },
          { label: "Phone", value: escapeHtml(order.customerPhone) },
          { label: "Payment Method", value: escapeHtml(getPaymentMethodLabel(order.paymentMethod)) },
          { label: "Amount Due", value: escapeHtml(formatCurrency(order.totalAmount)) },
          { label: "Shipping To", value: renderShippingAddress(order) },
        ])}
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Item</th>
              <th style="padding:0 0 8px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Qty</th>
              <th style="padding:0 0 8px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Line Total</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
      `,
    }),
  });
}

export async function sendCashOnDeliveryOrderEmails(
  order: Order & {
    items: OrderItem[];
  },
) {
  await Promise.all([
    sendCashOnDeliveryOrderCustomerEmail(order),
    sendCashOnDeliveryOrderAdminEmail(order),
  ]);
}

export async function sendPaidOrderCustomerEmail(
  order: Order & {
    items: OrderItem[];
  },
) {
  const orderLabel = order.id.slice(-8).toUpperCase();
  const itemsMarkup = renderOrderItemsMarkup(order.items);

  return sendEmail({
    to: order.customerEmail,
    subject: `Order confirmed - ${orderLabel}`,
    html: renderEmailShell({
      eyebrow: "Order Confirmed",
      title: `Thank you, ${order.customerName}`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Your payment has been received and your order is now marked as paid. We will follow up as the order moves toward fulfillment.
        </p>
        ${renderDefinitionList([
          { label: "Order", value: escapeHtml(orderLabel) },
          { label: "Payment Method", value: escapeHtml(getPaymentMethodLabel(order.paymentMethod)) },
          { label: "Total", value: escapeHtml(formatCurrency(order.totalAmount)) },
          { label: "Payment ID", value: escapeHtml(order.razorpayPaymentId ?? "Recorded") },
          { label: "Shipping To", value: renderShippingAddress(order) },
        ])}
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Item</th>
              <th style="padding:0 0 8px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Qty</th>
              <th style="padding:0 0 8px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Line Total</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
      `,
    }),
  });
}

export async function sendPaidOrderAdminEmail(
  order: Order & {
    items: OrderItem[];
  },
) {
  const orderLabel = order.id.slice(-8).toUpperCase();
  const itemsMarkup = renderOrderItemsMarkup(order.items);

  return sendAdminEmail({
    replyTo: order.customerEmail,
    subject: `[Order Paid] ${orderLabel} - ${order.customerName}`,
    html: renderEmailShell({
      eyebrow: "Paid Order",
      title: `Order ${orderLabel} is now paid`,
      body: `
        ${renderDefinitionList([
          { label: "Customer", value: escapeHtml(order.customerName) },
          { label: "Email", value: escapeHtml(order.customerEmail) },
          { label: "Phone", value: escapeHtml(order.customerPhone) },
          { label: "Payment Method", value: escapeHtml(getPaymentMethodLabel(order.paymentMethod)) },
          { label: "Total", value: escapeHtml(formatCurrency(order.totalAmount)) },
          { label: "Payment ID", value: escapeHtml(order.razorpayPaymentId ?? "Recorded") },
        ])}
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Item</th>
              <th style="padding:0 0 8px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Qty</th>
              <th style="padding:0 0 8px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7345;">Line Total</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
      `,
    }),
  });
}

export async function sendPaidOrderEmails(
  order: Order & {
    items: OrderItem[];
  },
) {
  await Promise.all([
    sendPaidOrderCustomerEmail(order),
    sendPaidOrderAdminEmail(order),
  ]);
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Reset your Kothakhahon password",
    html: renderEmailShell({
      eyebrow: "Account Security",
      title: "Password reset requested",
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          We received a request to reset the password for this account. Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${escapeHtml(resetUrl)}"
            style="display:inline-block;padding:14px 32px;border-radius:999px;background:#d8a84b;color:#1c1713;font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
            Reset Password
          </a>
        </div>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6b5a47;">
          If you did not request a password reset, ignore this email — your account remains secure.
        </p>
      `,
    }),
  });
}

export async function sendOrderShippedEmail({
  to,
  customerName,
  orderLabel,
  trackingNumber,
  carrier,
  trackingUrl,
}: {
  to: string;
  customerName: string;
  orderLabel: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
}) {
  const trackingSection = trackingNumber
    ? `
      ${renderDefinitionList([
        { label: "Carrier", value: escapeHtml(carrier ?? "Carrier") },
        { label: "Tracking No.", value: `<strong>${escapeHtml(trackingNumber)}</strong>` },
      ])}
      ${trackingUrl
        ? `<div style="text-align:center;margin:20px 0;">
            <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#d8a84b;color:#1c1713;font-family:Georgia,serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">TRACK PACKAGE</a>
          </div>`
        : `<p style="font-size:14px;color:#6b5a47;">Track your parcel using the number above on the carrier's website.</p>`
      }`
    : `<p style="margin:0;font-size:15px;line-height:1.7;color:#5b4a39;">Your parcel is on its way. You will receive a delivery notification when it arrives.</p>`;

  return sendEmail({
    to,
    subject: `Your order ${orderLabel} has been shipped`,
    html: renderEmailShell({
      eyebrow: "Order Shipped",
      title: `On its way, ${customerName}`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Your order <strong>${escapeHtml(orderLabel)}</strong> has been packed and handed to the carrier. It is now in transit to you.
        </p>
        ${trackingSection}
      `,
    }),
  });
}

export async function sendOrderDeliveredEmail({
  to,
  customerName,
  orderLabel,
  siteUrl,
}: {
  to: string;
  customerName: string;
  orderLabel: string;
  siteUrl: string;
}) {
  return sendEmail({
    to,
    subject: `Order ${orderLabel} delivered — enjoy the read`,
    html: renderEmailShell({
      eyebrow: "Delivered",
      title: `Delivered, ${customerName}`,
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1c1713;">
          Your order <strong>${escapeHtml(orderLabel)}</strong> has been marked as delivered. We hope the books arrive in perfect condition.
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#5b4a39;">
          If anything is missing or damaged, please reach out to us directly — we will make it right.
        </p>
        <div style="text-align:center;margin:20px 0;">
          <a href="${escapeHtml(siteUrl)}/contact" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#d8a84b;color:#1c1713;font-family:Georgia,serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">CONTACT THE DESK</a>
        </div>
      `,
    }),
  });
}
