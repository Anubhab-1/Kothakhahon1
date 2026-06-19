import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const cartItemsSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .max(50)
    .optional(),
});

const cartQuantitySchema = z.object({
  bookId: z.string().min(1),
  quantity: z.number().int().min(0).max(10),
});

// GET /api/cart - Fetch current user's DB cart items mapped to client LineItem structure
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cartItems = await db.cartItem.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const bookIds = cartItems.map((item) => item.bookId);
    const books = await db.book.findMany({
      where: { id: { in: bookIds } },
      include: { author: { select: { name: true } } },
    });

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const items = cartItems
      .map((item) => {
        const book = bookMap.get(item.bookId);
        if (!book) return null;
        return {
          bookId: item.bookId,
          title: book.title,
          authorName: book.author?.name ?? "Unknown Author",
          coverImageUrl: book.coverImageUrl ?? undefined,
          price: book.price ?? 0,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch DB cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/cart - Merge local/guest cart items into the DB cart
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = cartItemsSchema.parse(await request.json());
    const guestItems = payload.items;

    if (Array.isArray(guestItems)) {
      const bookIds = Array.from(new Set(guestItems.map((item) => item.bookId)));
      const existingBooks = await db.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true },
      });
      const existingBookIds = new Set(existingBooks.map((book) => book.id));

      for (const item of guestItems) {
        if (!existingBookIds.has(item.bookId)) {
          continue;
        }

        const qtyToIncrement = item.quantity;

        const existing = await db.cartItem.findUnique({
          where: {
            userId_bookId: { userId: session.userId, bookId: item.bookId },
          },
        });

        if (existing) {
          const newQty = Math.min(10, existing.quantity + qtyToIncrement);
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          });
        } else {
          await db.cartItem.create({
            data: {
              userId: session.userId,
              bookId: item.bookId,
              quantity: qtyToIncrement,
            },
          });
        }
      }
    }

    // Return the updated DB cart items
    return GET();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid cart payload." }, { status: 400 });
    }

    console.error("Failed to merge cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/cart - Set/Update the quantity of a specific book in DB cart
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bookId, quantity } = cartQuantitySchema.parse(await request.json());
    const existingBook = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (quantity === 0) {
      await db.cartItem.deleteMany({
        where: { userId: session.userId, bookId },
      });
    } else {
      await db.cartItem.upsert({
        where: {
          userId_bookId: { userId: session.userId, bookId },
        },
        update: { quantity },
        create: {
          userId: session.userId,
          bookId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid cart payload." }, { status: 400 });
    }

    console.error("Failed to update cart item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/cart - Delete specific book or clear the entire DB cart
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (bookId) {
      await db.cartItem.deleteMany({
        where: { userId: session.userId, bookId },
      });
    } else {
      await db.cartItem.deleteMany({
        where: { userId: session.userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete cart items:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
