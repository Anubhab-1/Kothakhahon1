"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function toggleWishlistAction(formData: FormData) {
  const session = await requireSession("/login");

  const bookId = formData.get("bookId") as string;
  const bookSlug = formData.get("bookSlug") as string;
  const bookTitle = formData.get("bookTitle") as string;
  const bookAuthor = formData.get("bookAuthor") as string;
  const bookCoverUrl = (formData.get("bookCoverUrl") as string) || null;
  const priceRaw = formData.get("price") as string;
  const price = priceRaw ? parseFloat(priceRaw) : null;

  if (!bookId || !bookSlug || !bookTitle) return;

  const existing = await db.wishlistItem.findUnique({
    where: { userId_bookId: { userId: session.userId, bookId } },
    select: { id: true },
  });

  if (existing) {
    await db.wishlistItem.delete({
      where: { userId_bookId: { userId: session.userId, bookId } },
    });
  } else {
    await db.wishlistItem.create({
      data: {
        userId: session.userId,
        bookId,
        bookSlug,
        bookTitle,
        bookAuthor,
        bookCoverUrl,
        price,
      },
    });
  }

  revalidatePath("/account/wishlist");
  revalidatePath(`/books/${bookSlug}`);
}
