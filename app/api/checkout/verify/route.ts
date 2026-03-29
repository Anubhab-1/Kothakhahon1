import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPaidOrderEmails } from "@/lib/email";
import { env } from "@/lib/env";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

function getExpectedSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySecret: string,
) {
  return crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

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

  const order = await db.order.findUnique({
    where: { id: payload.orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      razorpayOrderId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Order is cancelled." }, { status: 400 });
  }

  if (order.paymentMethod !== "razorpay") {
    return NextResponse.json({ error: "This order does not use Razorpay." }, { status: 400 });
  }

  const razorpaySecret = env.RAZORPAY_KEY_SECRET;
  if (!razorpaySecret) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  const expectedSignature = getExpectedSignature(
    payload.razorpayOrderId,
    payload.razorpayPaymentId,
    razorpaySecret,
  );

  if (expectedSignature !== payload.razorpaySignature) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  if (!order.razorpayOrderId || order.razorpayOrderId !== payload.razorpayOrderId) {
    return NextResponse.json({ error: "Order identifier mismatch." }, { status: 400 });
  }

  if (order.paymentStatus !== "paid") {
    const paidOrder = await db.order.update({
      where: { id: payload.orderId },
      data: {
        status: order.status === "fulfilled" ? "fulfilled" : "pending",
        paymentStatus: "paid",
        razorpayPaymentId: payload.razorpayPaymentId,
        paidAt: new Date(),
        paymentCollectedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    await sendPaidOrderEmails(paidOrder);
  }

  return NextResponse.json({ success: true });
}
