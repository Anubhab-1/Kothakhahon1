import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { Prisma } from "@/generated/prisma/client";
import {
  queueCashOnDeliveryOrderEmails,
  runEmailJobsAfterResponse,
} from "@/lib/email-jobs";
import { getEffectiveStockStatus, normalizeStockQuantity } from "@/lib/inventory";
import { commitOrderInventory, InventoryAdjustmentError } from "@/lib/order-inventory";
import { checkRateLimit } from "@/lib/rate-limit";
import { getShippingQuote } from "@/lib/shipping";
import { getSession } from "@/lib/auth/session";
import {
  calculateCouponDiscount,
  consumeCouponForOrder,
  CouponUsageError,
  releaseCouponForOrder,
} from "@/lib/coupons";

const shippingAddressSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  addressLine1: z.string().min(4),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().min(2),
  shippingMethod: z.enum(["standard", "express"]).optional().default("standard"),
});

const requestSchema = z.object({
  shippingAddress: shippingAddressSchema,
  items: z
    .array(
      z.object({
        bookId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  saveAddress: z.boolean().optional().default(false),
  // couponId from client is only used as a lookup key — discount re-computed server-side
  couponId: z.string().optional().nullable(),
});

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getRazorpayConfig() {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const publicKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? keyId ?? "";

  return {
    keyId: keyId ?? "",
    keySecret: keySecret ?? "",
    publicKey,
  };
}interface MappedBook {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string | null;
  price: number;
  stockQuantity: number;
  stockStatus: string;
}

async function getAuthoritativePricedItems(
  items: z.infer<typeof requestSchema>["items"],
  client: Prisma.TransactionClient | typeof db = db
) {
  const requestedBookIds = Array.from(
    new Set(items.map((item) => item.bookId).filter(Boolean)),
  );
  const bookClient = (client as typeof db).book || db.book;
  const books = await bookClient.findMany({
    where: {
      OR: [
        {
          id: {
            in: requestedBookIds,
          },
        },
        {
          slug: {
            in: requestedBookIds,
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });
  const bookMap = new Map<string, MappedBook>(
    books.flatMap((book) => [
      [
        book.id,
        {
          bookId: book.id,
          bookSlug: book.slug,
          bookTitle: book.title,
          bookAuthor: book.author?.name ?? "Unknown Author",
          bookCoverUrl: book.coverImageUrl ?? null,
          price: book.price ?? 0,
          stockQuantity: normalizeStockQuantity(book.stockQuantity),
          stockStatus: getEffectiveStockStatus(book),
        },
      ] as const,
      [
        book.slug,
        {
          bookId: book.id,
          bookSlug: book.slug,
          bookTitle: book.title,
          bookAuthor: book.author?.name ?? "Unknown Author",
          bookCoverUrl: book.coverImageUrl ?? null,
          price: book.price ?? 0,
          stockQuantity: normalizeStockQuantity(book.stockQuantity),
          stockStatus: getEffectiveStockStatus(book),
        },
      ] as const,
    ]),
  );

  const unavailableBookIds: string[] = [];
  const pricedItems = items
    .map((item) => {
      const mapped = bookMap.get(item.bookId);
      if (
        !mapped ||
        mapped.price <= 0 ||
        mapped.stockStatus === "out_of_stock" ||
        mapped.stockQuantity < item.quantity
      ) {
        unavailableBookIds.push(item.bookId);
        return null;
      }

      return {
        ...mapped,
        quantity: item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (unavailableBookIds.length > 0) {
    return {
      items: [],
      error: `Some cart items are unavailable or out of stock: ${unavailableBookIds.join(", ")}`,
    };
  }

  return {
    items: pricedItems,
    error: null,
  };
}

class OrderFlowValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderFlowValidationError";
    this.status = status;
  }
}

class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = await checkRateLimit({
    key: `checkout:${clientId}`,
    limit: 6,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const session = await getSession();
  const normalizedEmail = payload.shippingAddress.email.toLowerCase();

  let order;
  let totalAmountCalculated = 0;
  try {
    const transactionResult = await db.$transaction(async (tx) => {
      // 1. Idempotency Key check
      const idempotencyKey = request.headers.get("idempotency-key");
      if (idempotencyKey && tx.orderIdempotency) {
        const existing = await tx.orderIdempotency.findUnique({
          where: { key: idempotencyKey },
        });
        if (existing) {
          throw new IdempotencyConflictError("Duplicate order request");
        }
        await tx.orderIdempotency.create({
          data: {
            key: idempotencyKey,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });
      }

      // 2. Authoritative priced items (must query using tx!)
      const pricedResult = await getAuthoritativePricedItems(payload.items, tx);
      if (pricedResult.error) {
        throw new OrderFlowValidationError(pricedResult.error);
      }

      // 3. User checks using tx
      const userClient = tx.user || db.user;
      const registeredUser = await userClient.findUnique({
        where: { email: normalizedEmail },
        select: { emailVerifiedAt: true },
      });
      if (registeredUser && !registeredUser.emailVerifiedAt) {
        throw new OrderFlowValidationError(
          "Please verify your email address before placing an order. Check your inbox for the verification link or log in to resend it."
        );
      }

      const ownedBySession =
        session?.role === "CUSTOMER" && session.email.toLowerCase() === normalizedEmail;

      const subtotalAmount = pricedResult.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const shippingQuote = getShippingQuote({
        country: payload.shippingAddress.country,
        subtotalAmount,
        shippingMethod: payload.shippingAddress.shippingMethod,
      });
      const shippingAmount = shippingQuote.shippingAmount;

      if (!shippingQuote.serviceable) {
        throw new OrderFlowValidationError(shippingQuote.message);
      }

      let couponDiscount = 0;
      let validatedCoupon: { id: string; code: string; type: "percent" | "flat"; value: number } | null = null;

      const couponClient = tx.coupon || db.coupon;
      if (payload.couponId) {
        const coupon = await couponClient.findUnique({
          where: { id: payload.couponId },
          select: { id: true, code: true, type: true, value: true, minOrderAmount: true, maxUses: true, usedCount: true, expiresAt: true, isActive: true },
        });

        const couponValid =
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
          (coupon.minOrderAmount === null || subtotalAmount >= coupon.minOrderAmount);

        if (couponValid) {
          couponDiscount = calculateCouponDiscount({
            type: coupon.type,
            value: coupon.value,
            subtotalAmount,
          });
          validatedCoupon = coupon;
        }
      }

      const discountAmount = couponDiscount;
      const totalAmount = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

      if (totalAmount <= 0) {
        throw new OrderFlowValidationError("Cart total is invalid.");
      }

      // Create Order
      const orderClient = tx.order || db.order;
      const createdOrder = await orderClient.create({
        data: {
          userId: ownedBySession ? session.userId : null,
          status: payload.paymentMethod === "cod" ? "pending" : "payment_pending",
          paymentMethod: payload.paymentMethod,
          paymentStatus: "pending",
          customerName: payload.shippingAddress.fullName,
          customerEmail: normalizedEmail,
          customerPhone: payload.shippingAddress.phone,
          addressLine1: payload.shippingAddress.addressLine1,
          addressLine2: payload.shippingAddress.addressLine2,
          city: payload.shippingAddress.city,
          state: payload.shippingAddress.state,
          postalCode: payload.shippingAddress.postalCode,
          country: payload.shippingAddress.country,
          subtotalAmount,
          shippingAmount,
          shippingMethod: payload.shippingAddress.shippingMethod ?? "standard",
          discountAmount,
          couponId: validatedCoupon?.id ?? null,
          couponCode: validatedCoupon?.code ?? null,
          totalAmount,
          items: {
            create: pricedResult.items.map((item) => ({
              bookId: item.bookId,
              bookSlug: item.bookSlug,
              bookTitle: item.bookTitle,
              bookAuthor: item.bookAuthor,
              bookCoverUrl: item.bookCoverUrl,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Record coupon usage
      if (validatedCoupon) {
        await consumeCouponForOrder(tx, {
          couponId: validatedCoupon.id,
          orderId: createdOrder.id,
          userId: ownedBySession ? session.userId : null,
          discount: discountAmount,
        });
      }

      // Commit inventory if COD
      if (payload.paymentMethod === "cod") {
        await commitOrderInventory(tx, createdOrder.id);
      }

      // Save Address
      const addressClient = tx.address || db.address;
      if (ownedBySession && payload.saveAddress) {
        const addressExists = await addressClient.findFirst({
          where: {
            userId: session.userId,
            fullName: payload.shippingAddress.fullName,
            phone: payload.shippingAddress.phone,
            addressLine1: payload.shippingAddress.addressLine1,
            addressLine2: payload.shippingAddress.addressLine2 ?? null,
            city: payload.shippingAddress.city,
            state: payload.shippingAddress.state,
            postalCode: payload.shippingAddress.postalCode,
            country: payload.shippingAddress.country,
          },
        });

        if (!addressExists) {
          const existingCount = await addressClient.count({
            where: { userId: session.userId },
          });

          await addressClient.create({
            data: {
              userId: session.userId,
              label: existingCount === 0 ? "Home" : "Other",
              fullName: payload.shippingAddress.fullName,
              phone: payload.shippingAddress.phone,
              addressLine1: payload.shippingAddress.addressLine1,
              addressLine2: payload.shippingAddress.addressLine2 ?? null,
              city: payload.shippingAddress.city,
              state: payload.shippingAddress.state,
              postalCode: payload.shippingAddress.postalCode,
              country: payload.shippingAddress.country,
              isDefault: existingCount === 0,
            },
          });
        }
      }

      // Clear Cart
      const cartClient = tx.cartItem || db.cartItem;
      if (ownedBySession) {
        await cartClient.deleteMany({
          where: { userId: session.userId },
        });
      }

      // Queue COD emails inside transaction if COD
      if (payload.paymentMethod === "cod") {
        await queueCashOnDeliveryOrderEmails(createdOrder.id, tx);
      }

      return { order: createdOrder, totalAmount };
    }, { isolationLevel: "Serializable" });

    order = transactionResult.order;
    totalAmountCalculated = transactionResult.totalAmount;
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json({ error: "Order is already processing or was created with this key." }, { status: 409 });
    }
    if (error instanceof OrderFlowValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof InventoryAdjustmentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CouponUsageError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  if (payload.paymentMethod === "cod") {
    try {
      runEmailJobsAfterResponse();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "COD email job process failed.");
    }

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "cod",
      redirectUrl: `/checkout/success?order=${encodeURIComponent(order.id)}`,
    });
  }

  const { keyId, keySecret, publicKey } = getRazorpayConfig();
  if (!keyId || !keySecret || !publicKey) {
    await db.$transaction(async (tx) => {
      await releaseCouponForOrder(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
        },
      });
    });

    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmountCalculated * 100),
      currency: "INR",
      receipt: order.id.slice(0, 40),
      notes: {
        local_order_id: order.id,
        customer_email: order.customerEmail,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: publicKey,
    });
  } catch {
    await db.$transaction(async (tx) => {
      await releaseCouponForOrder(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
        },
      });
    });

    return NextResponse.json({ error: "Razorpay order creation failed." }, { status: 500 });
  }
}
