import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

// GET /api/wishlist - Fetch user's wishlist items
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db.wishlistItem.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/wishlist - Add a book to user's wishlist
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bookId } = await request.json();
    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Fetch book details to populate the wishlist item server-side
    const book = await db.book.findUnique({
      where: { id: bookId },
      include: { author: { select: { name: true } } },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const item = await db.wishlistItem.upsert({
      where: {
        userId_bookId: { userId: session.userId, bookId },
      },
      update: {}, // Keep existing if already in wishlist
      create: {
        userId: session.userId,
        bookId,
        bookSlug: book.slug,
        bookTitle: book.title,
        bookAuthor: book.author?.name ?? "Unknown Author",
        bookCoverUrl: book.coverImageUrl ?? null,
        price: book.price ?? null,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Failed to add to wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/wishlist - Remove a book from user's wishlist
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    await db.wishlistItem.deleteMany({
      where: {
        userId: session.userId,
        bookId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove from wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
