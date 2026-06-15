import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { queuePaidOrderEmails, runEmailJobsAfterResponse } from "@/lib/email-jobs";
import {
  finalizePaidRazorpayOrder,
  isRazorpayCheckoutSignatureValid,
  PaymentProcessingError,
} from "@/lib/payments";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof verifySchema>;
  try {
    payload = verifySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid payment verification payload." },
      { status: 400 },
    );
  }

  const razorpaySecret = env.RAZORPAY_KEY_SECRET;
  if (!razorpaySecret) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  const isValid = isRazorpayCheckoutSignatureValid({
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
    razorpaySecret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  try {
    const result = await finalizePaidRazorpayOrder({
      localOrderId: payload.orderId,
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
    });

    if (result.outcome === "paid") {
      try {
        await queuePaidOrderEmails(result.order.id);
        runEmailJobsAfterResponse();
      } catch (error) {
        console.error(
          error instanceof Error ? error.message : "Paid order email job enqueue failed.",
        );
      }
    }
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }

  return NextResponse.json({ success: true });
}
