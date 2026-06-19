import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
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
}

async function getAuthoritativePricedItems(items: z.infer<typeof requestSchema>["items"]) {
  const requestedBookIds = Array.from(
    new Set(items.map((item) => item.bookId).filter(Boolean)),
  );
  const books = await db.book.findMany({
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
  const bookMap = new Map(
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

  const pricedResult = await getAuthoritativePricedItems(payload.items);
  if (pricedResult.error) {
    return NextResponse.json({ error: pricedResult.error }, { status: 400 });
  }

  const session = await getSession();
  const normalizedEmail = payload.shippingAddress.email.toLowerCase();

  // Check if email belongs to a registered user who is unverified
  const registeredUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { emailVerifiedAt: true },
  });
  if (registeredUser && !registeredUser.emailVerifiedAt) {
    return NextResponse.json(
      {
        error:
          "Please verify your email address before placing an order. Check your inbox for the verification link or log in to resend it.",
      },
      { status: 400 },
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

  // ── Server-side coupon validation ───────────────────────────────────────
  let couponDiscount = 0;
  let validatedCoupon: { id: string; code: string; type: "percent" | "flat"; value: number } | null = null;

  if (payload.couponId) {
    const coupon = await db.coupon.findUnique({
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
    return NextResponse.json({ error: "Cart total is invalid." }, { status: 400 });
  }

  if (!shippingQuote.serviceable) {
    return NextResponse.json({ error: shippingQuote.message }, { status: 400 });
  }

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
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

      // Atomically record coupon usage and increment usedCount
      if (validatedCoupon) {
        await consumeCouponForOrder(tx, {
          couponId: validatedCoupon.id,
          orderId: createdOrder.id,
          userId: ownedBySession ? session.userId : null,
          discount: discountAmount,
        });
      }

      if (payload.paymentMethod === "cod") {
        await commitOrderInventory(tx, createdOrder.id);
      }

      // Save the checkout address to the customer's saved addresses when requested.
      if (ownedBySession && payload.saveAddress) {
        const addressExists = await tx.address.findFirst({
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
          const existingCount = await tx.address.count({
            where: { userId: session.userId },
          });

          await tx.address.create({
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

      // Clear user's DB cart if logged in and order owned by session
      if (ownedBySession) {
        await tx.cartItem.deleteMany({
          where: { userId: session.userId },
        });
      }

      return createdOrder;
    });
  } catch (error) {
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
      await queueCashOnDeliveryOrderEmails(order.id);
      runEmailJobsAfterResponse();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "COD email job enqueue failed.");
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
      amount: Math.round(totalAmount * 100),
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
