import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllBooks } from "@/lib/content";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendCashOnDeliveryOrderEmails } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";

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
  const books = await getAllBooks();
  const bookMap = new Map(
    books.flatMap((book) => [
      [
        book._id,
        {
          bookId: book._id,
          bookSlug: book.slug,
          bookTitle: book.title,
          bookAuthor: book.author?.name ?? "Unknown Author",
          bookCoverUrl: book.coverImageUrl ?? null,
          price: book.price ?? 0,
        },
      ] as const,
      [
        book.slug,
        {
          bookId: book._id,
          bookSlug: book.slug,
          bookTitle: book.title,
          bookAuthor: book.author?.name ?? "Unknown Author",
          bookCoverUrl: book.coverImageUrl ?? null,
          price: book.price ?? 0,
        },
      ] as const,
    ]),
  );

  const missingBookIds: string[] = [];
  const pricedItems = items
    .map((item) => {
      const mapped = bookMap.get(item.bookId);
      if (!mapped || mapped.price <= 0) {
        missingBookIds.push(item.bookId);
        return null;
      }

      return {
        ...mapped,
        quantity: item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (missingBookIds.length > 0) {
    return {
      items: [],
      error: `Some cart items are no longer available: ${missingBookIds.join(", ")}`,
    };
  }

  return {
    items: pricedItems,
    error: null,
  };
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit({
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
  const ownedBySession =
    session?.role === "CUSTOMER" && session.email.toLowerCase() === normalizedEmail;

  const subtotalAmount = pricedResult.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingAmount = 0;
  const totalAmount = subtotalAmount + shippingAmount;

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Cart total is invalid." }, { status: 400 });
  }

  if (
    payload.paymentMethod === "cod" &&
    payload.shippingAddress.country.trim().toLowerCase() !== "india"
  ) {
    return NextResponse.json(
      { error: "Cash on delivery is currently available only for India deliveries." },
      { status: 400 },
    );
  }

  const order = await db.order.create({
    data: {
      userId: ownedBySession ? session.userId : null,
      status: "pending",
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

  if (payload.paymentMethod === "cod") {
    try {
      await sendCashOnDeliveryOrderEmails(order);
    } catch (error) {
      console.error(error instanceof Error ? error.message : "COD email send failed.");
    }

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "cod",
      redirectUrl: `/checkout/success?order=${encodeURIComponent(order.id)}`,
    });
  }

  const { keyId, keySecret, publicKey } = getRazorpayConfig();
  if (!keyId || !keySecret || !publicKey) {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        paymentStatus: "failed",
      },
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
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        paymentStatus: "failed",
      },
    });

    return NextResponse.json({ error: "Razorpay order creation failed." }, { status: 500 });
  }
}
