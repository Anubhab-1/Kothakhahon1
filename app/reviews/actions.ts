"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

function buildRedirect(path: string, params: Record<string, string>) {
  const sp = new URLSearchParams(params);
  return `${path}?${sp.toString()}`;
}

export async function submitReviewAction(formData: FormData) {
  const session = await requireSession("/login");

  const bookId   = (formData.get("bookId")   as string).trim();
  const bookSlug = (formData.get("bookSlug") as string).trim();
  const rating   = parseInt(formData.get("rating") as string, 10);
  const title    = (formData.get("title")    as string | null)?.trim() || null;
  const body     = (formData.get("body")     as string | null)?.trim() || null;

  if (!bookId || !bookSlug) {
    redirect(buildRedirect(`/books/${bookSlug}`, { reviewError: "Invalid book reference." }));
  }

  if (!rating || rating < 1 || rating > 5) {
    redirect(buildRedirect(`/books/${bookSlug}`, { reviewError: "Please select a star rating." }));
  }

  // One review per user per book — upsert so re-submits update, not error
  const existing = await db.review.findUnique({
    where: { userId_bookId: { userId: session.userId, bookId } },
    select: { id: true },
  });

  if (existing) {
    redirect(buildRedirect(`/books/${bookSlug}`, { reviewError: "You have already reviewed this book. Contact us to update your review." }));
  }

  // Check if user has purchased this book (verified badge)
  const hasPurchased = !!(await db.order.findFirst({
    where: {
      OR: [{ userId: session.userId }, { customerEmail: session.email }],
      status: { in: ["delivered", "shipped", "packed"] },
      items: { some: { bookId } },
    },
    select: { id: true },
  }));

  await db.review.create({
    data: {
      bookId,
      bookSlug,
      userId: session.userId,
      reviewerName: session.fullName ?? session.email.split("@")[0],
      rating,
      title,
      body,
      approved: false,       // admin must approve
      purchaseVerified: hasPurchased,
    },
  });

  revalidatePath(`/books/${bookSlug}`);
  redirect(buildRedirect(`/books/${bookSlug}`, { reviewNotice: "Thank you! Your review has been submitted and will appear after moderation." }));
}

export async function moderateReviewAction(formData: FormData) {
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
