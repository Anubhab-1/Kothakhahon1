import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { queuePaidOrderEmails, queueFailedPaymentAdminEmail, runEmailJobsAfterResponse } from "@/lib/email-jobs";
import {
  finalizePaidRazorpayOrder,
  isRazorpayWebhookSignatureValid,
  markRazorpayOrderFailed,
  PaymentProcessingError,
} from "@/lib/payments";

function parseWebhookBody(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getWebhookEventName(value: unknown) {
  if (!value || typeof value !== "object" || !("event" in value)) {
    return null;
  }

  const eventName = value.event;
  return typeof eventName === "string" ? eventName : null;
}

function getPaymentEntity(value: unknown) {
  if (!value || typeof value !== "object" || !("payload" in value)) {
    return null;
  }

  const payload = value.payload;
  if (!payload || typeof payload !== "object" || !("payment" in payload)) {
    return null;
  }

  const payment = payload.payment;
  if (!payment || typeof payment !== "object" || !("entity" in payment)) {
    return null;
  }

  const entity = payment.entity;
  if (!entity || typeof entity !== "object") {
    return null;
  }

  const paymentId = "id" in entity && typeof entity.id === "string" ? entity.id : null;
  const razorpayOrderId =
    "order_id" in entity && typeof entity.order_id === "string" ? entity.order_id : null;
  const notes =
    "notes" in entity && entity.notes && typeof entity.notes === "object" ? entity.notes : null;
  const localOrderId =
    notes && "local_order_id" in notes && typeof notes.local_order_id === "string"
      ? notes.local_order_id
      : undefined;
  const errorDescription =
    "error_description" in entity && typeof entity.error_description === "string"
      ? entity.error_description
      : "Unknown Razorpay payment failure";

  if (!paymentId || !razorpayOrderId) {
    return null;
  }

  return {
    paymentId,
    razorpayOrderId,
    localOrderId,
    errorDescription,
  };
}

export async function POST(request: Request) {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Razorpay webhook secret is not configured." }, { status: 503 });
  }

  const webhookSignature = request.headers.get("x-razorpay-signature");
  if (!webhookSignature) {
    return NextResponse.json({ error: "Missing Razorpay signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = isRazorpayWebhookSignatureValid({
    rawBody,
    webhookSignature,
    webhookSecret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  const webhookBody = parseWebhookBody(rawBody);
  const eventName = getWebhookEventName(webhookBody);

  if (!eventName) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (eventName === "payment.captured" || eventName === "order.paid") {
    const payment = getPaymentEntity(webhookBody);
    if (!payment) {
      return NextResponse.json({ error: "Missing payment entity." }, { status: 400 });
    }

    try {
      const result = await finalizePaidRazorpayOrder({
        localOrderId: payment.localOrderId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.paymentId,
      });

      if (result.outcome === "paid") {
        try {
          await queuePaidOrderEmails(result.order.id);
          runEmailJobsAfterResponse();
        } catch (error) {
          console.error(
            error instanceof Error ? error.message : "Webhook email job enqueue failed.",
          );
        }
      }

      return NextResponse.json({
        received: true,
        event: eventName,
        outcome: result.outcome,
      });
    } catch (error) {
      if (error instanceof PaymentProcessingError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      throw error;
    }
  }

  if (eventName === "payment.failed") {
    const payment = getPaymentEntity(webhookBody);
    if (payment) {
      const result = await markRazorpayOrderFailed({
        razorpayOrderId: payment.razorpayOrderId,
      });
      if (result.outcome === "marked_failed") {
        try {
          await queueFailedPaymentAdminEmail(result.orderId, payment.errorDescription);
          runEmailJobsAfterResponse();
        } catch (error) {
          console.error(
            error instanceof Error ? error.message : "Failed payment email job enqueue failed."
          );
        }
      }
    }

    return NextResponse.json({
      received: true,
      event: eventName,
      outcome: "processed",
    });
  }

  return NextResponse.json({
    received: true,
    event: eventName,
    outcome: "ignored",
  });
}
