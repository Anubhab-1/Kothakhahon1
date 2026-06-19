"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { requireAdminSession } from "@/lib/auth/admin";

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createBookReviewAction(formData: FormData) {
  const bookId = optionalString(formData, "bookId");
  const bookSlug = optionalString(formData, "bookSlug");
  const reviewerName = optionalString(formData, "reviewerName");
  const title = optionalString(formData, "title");
  const body = optionalString(formData, "body");
  const rating = Number.parseInt(optionalString(formData, "rating"), 10);
  const nextPath = bookSlug ? `/books/${bookSlug}` : "/books";
  const session = await requireSession(`${nextPath}#reviews`);

  if (session.role === "ADMIN") {
    redirect(`${nextPath}?review=admin#reviews`);
  }

  if (!bookId || !bookSlug || Number.isNaN(rating) || rating < 1 || rating > 5) {
    redirect(`${nextPath}?review=invalid#reviews`);
  }

  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { id: true, slug: true },
  });

  if (!book || book.slug !== bookSlug) {
    redirect("/books?review=missing");
  }

  const purchase = await db.order.findFirst({
    where: {
      userId: session.userId,
      status: { in: ["paid", "processing", "packed", "shipped", "delivered"] },
      items: {
        some: { bookId },
      },
    },
    select: { id: true },
  });

  await db.review.upsert({
    where: {
      userId_bookId: {
        userId: session.userId,
        bookId,
      },
    },
    update: {
      reviewerName: reviewerName || session.fullName || session.email,
      rating,
      title: title || null,
      body: body || null,
      approved: false,
      purchaseVerified: Boolean(purchase),
    },
    create: {
      bookId,
      bookSlug,
      userId: session.userId,
      reviewerName: reviewerName || session.fullName || session.email,
      rating,
      title: title || null,
      body: body || null,
      approved: false,
      purchaseVerified: Boolean(purchase),
    },
  });

  revalidatePath(`/books/${bookSlug}`);
  revalidatePath("/admin/reviews");
  redirect(`${nextPath}?review=submitted#reviews`);
}

export async function moderateReviewAction(formData: FormData) {
  await requireAdminSession();
  const reviewId = (formData.get("reviewId") as string).trim();
  const action   = (formData.get("action")   as string).trim(); // "approve" | "reject"

  if (!reviewId || !["approve", "reject"].includes(action)) return;

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, bookId: true, bookSlug: true },
  });

  if (!review) return;

  if (action === "approve") {
    await db.review.update({ where: { id: reviewId }, data: { approved: true } });

    // Recalculate averageRating and reviewCount on the book
    const stats = await db.review.aggregate({
      where: { bookId: review.bookId, approved: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await db.book.update({
      where: { id: review.bookId },
      data: {
        averageRating: stats._avg.rating ?? 0,
        reviewCount:   stats._count.id,
      },
    });
  } else {
    await db.review.delete({ where: { id: reviewId } });
  }

  revalidatePath(`/books/${review.bookSlug}`);
  revalidatePath("/admin/reviews");
}
