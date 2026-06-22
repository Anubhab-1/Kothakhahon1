import { NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { Prisma } from "@/generated/prisma/client";
import {
  queueCashOnDeliveryOrderEmails,
  queuePaidOrderEmails,
  runEmailJobsAfterResponse,
} from "@/lib/email-jobs";
import { getDerivedStockStatus } from "@/lib/inventory";
import { calculateCouponDiscount, consumeCouponForOrder } from "@/lib/coupons";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const checkoutItemSchema = z.object({
  bookId: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().positive(),
});

const checkoutCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

const checkoutRequestSchema = z.object({
  cartItems: z.array(checkoutItemSchema).min(1),
  customer: checkoutCustomerSchema,
  paymentMethod: z.enum(["cod", "razorpay"]),
  idempotencyKey: z.string().uuid(),
  couponCode: z.string().optional().nullable(),
});

async function getRateLimitResponse(ip: string) {
  const rl = await checkRateLimit({
    key: `api-checkout-root:${ip}`,
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout requests. Please wait before attempting again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }
  return null;
}

export async function GET() {
  const ip = await getClientIp();
  const rlResponse = await getRateLimitResponse(ip);
  if (rlResponse) return rlResponse;

  return NextResponse.json({ active: true });
}

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rlResponse = await getRateLimitResponse(ip);
  if (rlResponse) return rlResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parseResult = checkoutRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { cartItems, customer, paymentMethod, idempotencyKey, couponCode } = parseResult.data;

  try {
    const session = await getSession();
    const ownedBySession =
      session?.role === "CUSTOMER" &&
      session.email.toLowerCase() === customer.email.toLowerCase();

    const transactionResult = await db.$transaction(
      async (tx) => {
        // 1. Idempotency Replay Check
        const existingIdempotency = await tx.orderIdempotency.findUnique({
          where: { key: idempotencyKey },
        });
        if (existingIdempotency) {
          if (existingIdempotency.orderId) {
            const existingOrder = await tx.order.findUnique({
              where: { id: existingIdempotency.orderId },
            });
            if (existingOrder) {
              return {
                isReplay: true,
                orderId: existingOrder.id,
                totalAmount: existingOrder.totalAmount,
                customerEmail: existingOrder.customerEmail,
                razorpayOrderId: existingOrder.razorpayOrderId,
              };
            }
          }
          return {
            isReplay: true,
            orderId: existingIdempotency.orderId,
            totalAmount: 0,
            customerEmail: "",
            razorpayOrderId: null,
          };
        }

        // 2. Fetch books and verify stock
        const bookDetailsMap = new Map<string, Prisma.BookGetPayload<{ include: { author: { select: { name: true } } } }>>();
        for (const item of cartItems) {
          const book = await tx.book.findUnique({
            where: { id: item.bookId },
            include: { author: { select: { name: true } } },
          });

          if (!book) {
            throw new Error("BOOK_NOT_FOUND:" + item.bookId);
          }
          if (book.stockQuantity < item.quantity) {
            throw new Error("INSUFFICIENT_STOCK:" + book.title);
          }
          bookDetailsMap.set(item.bookId, book);
        }

        // 3. Decrement Stock
        for (const item of cartItems) {
          const book = bookDetailsMap.get(item.bookId)!;
          const nextQuantity = book.stockQuantity - item.quantity;
          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stockQuantity: { decrement: item.quantity },
              stockStatus: getDerivedStockStatus(nextQuantity, book.lowStockThreshold),
            },
          });
        }

        // 4. Billing Calculations
        const subtotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingAmount = subtotalAmount < 500 ? 50 : 0;

        let discountAmount = 0;
        let validatedCoupon = null;

        if (couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: couponCode },
          });

          const couponValid =
            coupon &&
            coupon.isActive &&
            (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
            (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
            (coupon.minOrderAmount === null || subtotalAmount >= coupon.minOrderAmount);

          if (couponValid) {
            discountAmount = calculateCouponDiscount({
              type: coupon.type,
              value: coupon.value,
              subtotalAmount,
            });
            validatedCoupon = coupon;
          }
        }

        const totalAmount = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

        // 5. Create Order
        const dbOrder = await tx.order.create({
          data: {
            userId: ownedBySession ? session.userId : null,
            status: "pending",
            paymentMethod,
            paymentStatus: "pending",
            customerName: customer.name,
            customerEmail: customer.email.toLowerCase(),
            customerPhone: customer.phone,
            addressLine1: customer.addressLine1,
            addressLine2: customer.addressLine2 || null,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            country: customer.country,
            subtotalAmount,
            shippingAmount,
            shippingMethod: "standard",
            discountAmount,
            couponId: validatedCoupon?.id ?? null,
            couponCode: validatedCoupon?.code ?? null,
            totalAmount,
            inventoryCommittedAt: new Date(),
          },
        });

        // 6. Create OrderItems
        await tx.orderItem.createMany({
          data: cartItems.map((item) => {
            const book = bookDetailsMap.get(item.bookId)!;
            return {
              orderId: dbOrder.id,
              bookId: item.bookId,
              bookSlug: book.slug,
              bookTitle: book.title,
              bookAuthor: book.author?.name ?? "Unknown Author",
              bookCoverUrl: book.coverImageUrl ?? null,
              quantity: item.quantity,
              price: book.price ?? item.price,
            };
          }),
        });

        // 7. Consume Coupon
        if (validatedCoupon) {
          await consumeCouponForOrder(tx, {
            couponId: validatedCoupon.id,
            orderId: dbOrder.id,
            userId: ownedBySession ? session.userId : null,
            discount: discountAmount,
          });
        }

        // 8. Add Shipping Address to User Address Book
        if (ownedBySession) {
          const addressExists = await tx.address.findFirst({
            where: {
              userId: session.userId,
              fullName: customer.name,
              phone: customer.phone,
              addressLine1: customer.addressLine1,
              addressLine2: customer.addressLine2 ?? null,
              city: customer.city,
              state: customer.state,
              postalCode: customer.postalCode,
              country: customer.country,
            },
          });

          if (!addressExists) {
            const existingCount = await tx.address.count({
              where: { userId: session.userId },
            });

            await tx.address.create({
              data: {
                userId: session.userId,
                label: existingCount === 0 ? "Home" : "Other",
                fullName: customer.name,
                phone: customer.phone,
                addressLine1: customer.addressLine1,
                addressLine2: customer.addressLine2 ?? null,
                city: customer.city,
                state: customer.state,
                postalCode: customer.postalCode,
                country: customer.country,
                isDefault: existingCount === 0,
              },
            });
          }
        }

        // 9. Clear DB Cart
        if (ownedBySession) {
          await tx.cartItem.deleteMany({
            where: { userId: session.userId },
          });
        }

        // 10. Record Idempotency Key
        await tx.orderIdempotency.create({
          data: {
            key: idempotencyKey,
            orderId: dbOrder.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
          },
        });

        // 11. Queue email jobs
        if (paymentMethod === "cod") {
          await queueCashOnDeliveryOrderEmails(dbOrder.id, tx);
        } else {
          await queuePaidOrderEmails(dbOrder.id, tx);
        }

        return {
          isReplay: false,
          orderId: dbOrder.id,
          totalAmount: dbOrder.totalAmount,
          customerEmail: dbOrder.customerEmail,
          razorpayOrderId: dbOrder.razorpayOrderId,
        };
      },
      { isolationLevel: "Serializable" }
    );

    const { isReplay, orderId, totalAmount, customerEmail, razorpayOrderId } = transactionResult;

    if (!orderId) {
      return NextResponse.json({ error: "Idempotency conflict: key already reserved without a valid order." }, { status: 409 });
    }

    if (paymentMethod === "cod") {
      try {
        runEmailJobsAfterResponse();
      } catch (err) {
        logger.error("Failed to run background email workers", err);
      }

      return NextResponse.json({
        orderId,
        paymentMethod: "cod",
        redirectUrl: `/order-confirmation?orderId=${orderId}`,
      });
    }

    // Razorpay Flow
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID ?? "";

    if (isReplay && razorpayOrderId) {
      return NextResponse.json({
        orderId,
        razorpayOrderId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        key: publicKey,
      });
    }

    if (!keyId || !keySecret) {
      logger.error("Razorpay API credentials missing in checkout.");
      return NextResponse.json({ error: "Payment gateway configuration error." }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: orderId.slice(0, 40),
      notes: {
        local_order_id: orderId,
        customer_email: customerEmail,
      },
    });

    await db.order.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: "INR",
      key: publicKey,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.startsWith("INSUFFICIENT_STOCK:")) {
      const title = errorMessage.replace("INSUFFICIENT_STOCK:", "");
      return NextResponse.json({ error: `Insufficient stock for: ${title}` }, { status: 409 });
    }

    logger.error("Checkout creation failed unexpectedly", error);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
