"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { bootstrapSeedContent } from "@/lib/bootstrap-content";
import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
} from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/slug";
import { invalidateContentPresenceCache } from "@/lib/content";
import {
  getDerivedStockStatus,
  normalizeLowStockThreshold,
  normalizeStockQuantity,
} from "@/lib/inventory";
import {
  commitOrderInventory,
  InventoryAdjustmentError,
  releaseOrderInventory,
} from "@/lib/order-inventory";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function requiredString(formData: FormData, key: string, label: string) {
  const value = optionalString(formData, key);
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function parseCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseFloatField(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${key}.`);
  }
  if (parsed < 0) {
    throw new Error(`${key} cannot be negative.`);
  }
  return parsed;
}

function parseIntField(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${key}.`);
  }
  if (parsed < 0) {
    throw new Error(`${key} cannot be negative.`);
  }
  return parsed;
}

function parseLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildRedirect(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function extractPrismaErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A record with this slug or unique field already exists.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function rethrowIfRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath("/authors");
  revalidatePath("/blog");
  revalidatePath("/about");
}

async function ensureGenres(names: string[]) {
  const genreIds: string[] = [];

  for (const name of names) {
    const slug = slugify(name);
    const genre = await db.genre.upsert({
      where: { slug },
      update: {
        name,
      },
      create: {
        name,
        slug,
      },
    });

    genreIds.push(genre.id);
  }

  return genreIds;
}

async function ensureAuthorExists(authorId: string) {
  const author = await db.author.findUnique({
    where: { id: authorId },
    select: { id: true },
  });

  if (!author) {
    throw new Error("Selected author no longer exists.");
  }
}

export async function loginAdminAction(formData: FormData) {
  const email = optionalString(formData, "email").toLowerCase();
  const password = optionalString(formData, "password");

  if (!email || !password) {
    redirect(buildRedirect("/login", { next: "/admin", error: "Email and password are required." }));
  }

  const admin = await db.user.findUnique({
    where: { email },
  });

  if (
    !admin ||
    admin.role !== "ADMIN" ||
    !admin.isActive ||
    !verifyPassword(password, admin.passwordHash)
  ) {
    redirect(buildRedirect("/login", { next: "/admin", error: "Invalid admin credentials." }));
  }

  await createAdminSession(admin);
  await db.user.update({
    where: {
      id: admin.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/login");
}

export async function bootstrapSeedContentAction() {
  await requireAdminSession();

  const result = await bootstrapSeedContent();

  if (!result.imported) {
    redirect(buildRedirect("/admin", { notice: result.reason }));
  }

  invalidateContentPresenceCache();
  revalidateStorefront();
  redirect(buildRedirect("/admin", { notice: "Current catalog imported into the database." }));
}

export async function saveAuthorAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalString(formData, "id");
  const name = requiredString(formData, "name", "Author name");
  const slug = slugify(optionalString(formData, "slug") || name);
  const bio = optionalString(formData, "bio");
  const photoUrl = optionalString(formData, "photoUrl");
  const featured = parseCheckbox(formData, "featured");
  const awards = parseLines(optionalString(formData, "awards"));

  try {
    const existingAuthor = id
      ? await db.author.findUnique({
          where: { id },
          select: { slug: true },
        })
      : null;

    const author = id
      ? await db.author.update({
          where: { id },
          data: {
            name,
            slug,
            bio: bio || null,
            photoUrl: photoUrl || null,
            featured,
          },
        })
      : await db.author.create({
          data: {
            name,
            slug,
            bio: bio || null,
            photoUrl: photoUrl || null,
            featured,
          },
        });

    await db.authorAward.deleteMany({
      where: {
        authorId: author.id,
      },
    });

    if (awards.length > 0) {
      await db.authorAward.createMany({
        data: awards.map((label, index) => ({
          authorId: author.id,
          label,
          position: index,
        })),
      });
    }

    invalidateContentPresenceCache();
    revalidateStorefront();
    revalidatePath("/admin/authors");
    revalidatePath(`/admin/authors/${author.id}`);
    revalidatePath(`/authors/${author.slug}`);
    if (existingAuthor?.slug && existingAuthor.slug !== author.slug) {
      revalidatePath(`/authors/${existingAuthor.slug}`);
    }
    redirect(buildRedirect(`/admin/authors/${author.id}`, { saved: "1" }));
  } catch (error) {
    rethrowIfRedirectError(error);
    const target = id ? `/admin/authors/${id}` : "/admin/authors/new";
    redirect(buildRedirect(target, { error: extractPrismaErrorMessage(error) }));
  }
}

export async function deleteAuthorAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Author id");
  const author = await db.author.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!author) {
    redirect(buildRedirect("/admin/authors", { error: "Author not found." }));
  }

  await db.author.delete({ where: { id } });

  invalidateContentPresenceCache();
  revalidateStorefront();
  revalidatePath("/admin/authors");
  revalidatePath(`/authors/${author.slug}`);
  redirect(buildRedirect("/admin/authors", { notice: "Author deleted." }));
}

export async function saveBookAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalString(formData, "id");
  const title = requiredString(formData, "title", "Book title");
  const slug = slugify(optionalString(formData, "slug") || title);
  const authorId = optionalString(formData, "authorId");
  const genreNames = parseLines(optionalString(formData, "genres"));
  const price = parseFloatField(formData, "price");
  const stockQuantity = normalizeStockQuantity(parseIntField(formData, "stockQuantity"));
  const lowStockThreshold = normalizeLowStockThreshold(parseIntField(formData, "lowStockThreshold"));
  const pageCount = parseIntField(formData, "pageCount");
  const reviewCount = parseIntField(formData, "reviewCount");
  const averageRating = parseFloatField(formData, "averageRating");
  const stockStatus = getDerivedStockStatus(stockQuantity, lowStockThreshold);

  try {
    if (authorId) {
      await ensureAuthorExists(authorId);
    }

    if (averageRating !== null && averageRating > 5) {
      throw new Error("averageRating cannot exceed 5.");
    }

    const existingBook = id
      ? await db.book.findUnique({
          where: { id },
          select: { slug: true },
        })
      : null;

    const book = id
      ? await db.book.update({
          where: { id },
          data: {
            title,
            titleEn: optionalString(formData, "titleEn") || null,
            slug,
            authorId: authorId || null,
            coverImageUrl: optionalString(formData, "coverImageUrl") || null,
            synopsis: optionalString(formData, "synopsis") || null,
            pullQuote: optionalString(formData, "pullQuote") || null,
            price,
            stockQuantity,
            lowStockThreshold,
            stockStatus,
            buyLink: optionalString(formData, "buyLink") || null,
            publicationDate: optionalString(formData, "publicationDate") || null,
            pageCount,
            isbn: optionalString(formData, "isbn") || null,
            language: optionalString(formData, "language") || null,
            featured: parseCheckbox(formData, "featured"),
            chapterPreview: optionalString(formData, "chapterPreview") || null,
            averageRating,
            reviewCount: reviewCount ?? 0,
          },
        })
      : await db.book.create({
          data: {
            title,
            titleEn: optionalString(formData, "titleEn") || null,
            slug,
            authorId: authorId || null,
            coverImageUrl: optionalString(formData, "coverImageUrl") || null,
            synopsis: optionalString(formData, "synopsis") || null,
            pullQuote: optionalString(formData, "pullQuote") || null,
            price,
            stockQuantity,
            lowStockThreshold,
            stockStatus,
            buyLink: optionalString(formData, "buyLink") || null,
            publicationDate: optionalString(formData, "publicationDate") || null,
            pageCount,
            isbn: optionalString(formData, "isbn") || null,
            language: optionalString(formData, "language") || null,
            featured: parseCheckbox(formData, "featured"),
            chapterPreview: optionalString(formData, "chapterPreview") || null,
            averageRating,
            reviewCount: reviewCount ?? 0,
          },
        });

    await db.bookGenre.deleteMany({
      where: {
        bookId: book.id,
      },
    });

    if (genreNames.length > 0) {
      const genreIds = await ensureGenres(genreNames);
      await db.bookGenre.createMany({
        data: genreIds.map((genreId, index) => ({
          bookId: book.id,
          genreId,
          position: index,
        })),
      });
    }

    invalidateContentPresenceCache();
    revalidateStorefront();
    revalidatePath("/admin/books");
    revalidatePath(`/admin/books/${book.id}`);
    revalidatePath(`/books/${slug}`);
    if (existingBook?.slug && existingBook.slug !== slug) {
      revalidatePath(`/books/${existingBook.slug}`);
    }
    redirect(buildRedirect(`/admin/books/${book.id}`, { saved: "1" }));
  } catch (error) {
    rethrowIfRedirectError(error);
    const target = id ? `/admin/books/${id}` : "/admin/books/new";
    redirect(buildRedirect(target, { error: extractPrismaErrorMessage(error) }));
  }
}

export async function deleteBookAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Book id");
  const book = await db.book.findUnique({
    where: { id },
  });

  if (!book) {
    redirect(buildRedirect("/admin/books", { error: "Book not found." }));
  }

  await db.book.delete({
    where: {
      id,
    },
  });

  invalidateContentPresenceCache();
  revalidateStorefront();
  revalidatePath("/admin/books");
  revalidatePath(`/books/${book.slug}`);
  redirect(buildRedirect("/admin/books", { notice: "Book deleted." }));
}

export async function saveBlogPostAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalString(formData, "id");
  const title = requiredString(formData, "title", "Post title");
  const slug = slugify(optionalString(formData, "slug") || title);
  const authorId = optionalString(formData, "authorId");

  try {
    if (authorId) {
      await ensureAuthorExists(authorId);
    }

    const existingPost = id
      ? await db.blogPost.findUnique({
          where: { id },
          select: { slug: true },
        })
      : null;

    const post = id
      ? await db.blogPost.update({
          where: { id },
          data: {
            title,
            slug,
            category: optionalString(formData, "category") || null,
            coverImageUrl: optionalString(formData, "coverImageUrl") || null,
            excerpt: optionalString(formData, "excerpt") || null,
            body: optionalString(formData, "body") || null,
            publishedAt: optionalString(formData, "publishedAt") || null,
            featured: parseCheckbox(formData, "featured"),
            authorId: authorId || null,
          },
        })
      : await db.blogPost.create({
          data: {
            title,
            slug,
            category: optionalString(formData, "category") || null,
            coverImageUrl: optionalString(formData, "coverImageUrl") || null,
            excerpt: optionalString(formData, "excerpt") || null,
            body: optionalString(formData, "body") || null,
            publishedAt: optionalString(formData, "publishedAt") || null,
            featured: parseCheckbox(formData, "featured"),
            authorId: authorId || null,
          },
        });

    invalidateContentPresenceCache();
    revalidateStorefront();
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${post.id}`);
    revalidatePath(`/blog/${slug}`);
    if (existingPost?.slug && existingPost.slug !== slug) {
      revalidatePath(`/blog/${existingPost.slug}`);
    }
    redirect(buildRedirect(`/admin/blog/${post.id}`, { saved: "1" }));
  } catch (error) {
    rethrowIfRedirectError(error);
    const target = id ? `/admin/blog/${id}` : "/admin/blog/new";
    redirect(buildRedirect(target, { error: extractPrismaErrorMessage(error) }));
  }
}

export async function deleteBlogPostAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Post id");
  const post = await db.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    redirect(buildRedirect("/admin/blog", { error: "Post not found." }));
  }

  await db.blogPost.delete({
    where: { id },
  });

  invalidateContentPresenceCache();
  revalidateStorefront();
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${post.slug}`);
  redirect(buildRedirect("/admin/blog", { notice: "Post deleted." }));
}

export async function saveSiteSettingsAction(formData: FormData) {
  await requireAdminSession();

  await db.siteSettings.upsert({
    where: {
      id: "site-settings",
    },
    update: {
      heroTagline: optionalString(formData, "heroTagline") || null,
      heroTaglineEn: optionalString(formData, "heroTaglineEn") || null,
      missionStatement: optionalString(formData, "missionStatement") || null,
      featuredAuthorId: optionalString(formData, "featuredAuthorId") || null,
      facebookUrl: optionalString(formData, "facebookUrl") || null,
      instagramUrl: optionalString(formData, "instagramUrl") || null,
      youtubeUrl: optionalString(formData, "youtubeUrl") || null,
      linkedinUrl: optionalString(formData, "linkedinUrl") || null,
      editorialEmail: optionalString(formData, "editorialEmail") || null,
      submissionsEmail: optionalString(formData, "submissionsEmail") || null,
      rightsEmail: optionalString(formData, "rightsEmail") || null,
      supportPhone: optionalString(formData, "supportPhone") || null,
      whatsappPhone: optionalString(formData, "whatsappPhone") || null,
      postalAddress: optionalString(formData, "postalAddress") || null,
    },
    create: {
      id: "site-settings",
      heroTagline: optionalString(formData, "heroTagline") || null,
      heroTaglineEn: optionalString(formData, "heroTaglineEn") || null,
      missionStatement: optionalString(formData, "missionStatement") || null,
      featuredAuthorId: optionalString(formData, "featuredAuthorId") || null,
      facebookUrl: optionalString(formData, "facebookUrl") || null,
      instagramUrl: optionalString(formData, "instagramUrl") || null,
      youtubeUrl: optionalString(formData, "youtubeUrl") || null,
      linkedinUrl: optionalString(formData, "linkedinUrl") || null,
      editorialEmail: optionalString(formData, "editorialEmail") || null,
      submissionsEmail: optionalString(formData, "submissionsEmail") || null,
      rightsEmail: optionalString(formData, "rightsEmail") || null,
      supportPhone: optionalString(formData, "supportPhone") || null,
      whatsappPhone: optionalString(formData, "whatsappPhone") || null,
      postalAddress: optionalString(formData, "postalAddress") || null,
    },
  });

  revalidateStorefront();
  revalidatePath("/admin/settings");
  redirect(buildRedirect("/admin/settings", { saved: "1" }));
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Order id");
  const status = requiredString(formData, "status", "Order status") as OrderStatus;
  const paymentStatus = requiredString(formData, "paymentStatus", "Payment status") as PaymentStatus;
  const trackingNumber = optionalString(formData, "trackingNumber") || null;
  const carrier = optionalString(formData, "carrier") || null;

  if (!Object.values(OrderStatus).includes(status)) {
    redirect(buildRedirect(`/admin/orders/${id}`, { error: "Invalid order status." }));
  }

  if (!Object.values(PaymentStatus).includes(paymentStatus)) {
    redirect(buildRedirect(`/admin/orders/${id}`, { error: "Invalid payment status." }));
  }

  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          status: true,
          paymentMethod: true,
          paymentCollectedAt: true,
          paidAt: true,
          processingAt: true,
          packedAt: true,
          shippedAt: true,
          deliveredAt: true,
          cancelledAt: true,
          refundedAt: true,
        },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      const shouldReleaseInventory =
        status === "cancelled" || status === "refunded" || paymentStatus === "refunded";
      const shouldCommitInventory =
        !shouldReleaseInventory &&
        (paymentStatus === "paid" || order.paymentMethod === "cod");

      if (shouldReleaseInventory) {
        await releaseOrderInventory(tx, id);
      } else if (shouldCommitInventory) {
        await commitOrderInventory(tx, id);
      }

      const now = new Date();
      const nextPaidTimestamp =
        paymentStatus === "paid"
          ? order.paymentCollectedAt ?? order.paidAt ?? now
          : order.paymentCollectedAt;
      const reachedProcessing = ["processing", "packed", "shipped", "delivered"].includes(status);
      const reachedPacked = ["packed", "shipped", "delivered"].includes(status);
      const reachedShipped = ["shipped", "delivered"].includes(status);
      const reachedDelivered = status === "delivered";

      await tx.order.update({
        where: { id },
        data: {
          status,
          paymentStatus,
          trackingNumber,
          carrier,
          paymentCollectedAt: nextPaidTimestamp,
          paidAt: paymentStatus === "paid" ? order.paidAt ?? now : order.paidAt,
          processingAt: reachedProcessing ? order.processingAt ?? now : order.processingAt,
          packedAt: reachedPacked ? order.packedAt ?? now : order.packedAt,
          shippedAt: reachedShipped ? order.shippedAt ?? now : order.shippedAt,
          deliveredAt: reachedDelivered ? order.deliveredAt ?? now : order.deliveredAt,
          cancelledAt: status === "cancelled" ? order.cancelledAt ?? now : order.cancelledAt,
          refundedAt:
            status === "refunded" || paymentStatus === "refunded"
              ? order.refundedAt ?? now
              : order.refundedAt,
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof InventoryAdjustmentError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unable to update order.";
    redirect(buildRedirect(`/admin/orders/${id}`, { error: message }));
  }

  // --- Transactional emails on status transitions ---
  // Fetch updated order data after transaction commits
  const updatedOrder = await db.order.findUnique({
    where: { id },
    select: {
      status: true,
      customerEmail: true,
      customerName: true,
      trackingNumber: true,
      carrier: true,
    },
  });

  if (updatedOrder) {
    const orderLabel = `#${id.slice(-8).toUpperCase()}`;
    const siteUrl = getSiteUrl().toString().replace(/\/$/, "");

    function getTrackingUrl(carrierName?: string | null, trackingNo?: string | null) {
      if (!carrierName || !trackingNo) return null;
      const c = carrierName.toLowerCase().trim();
      if (c === "delhivery") return `https://www.delhivery.com/track/package/${trackingNo.trim()}`;
      if (c === "dhl") return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNo.trim()}`;
      if (c === "fedex") return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNo.trim()}`;
      return null;
    }

    try {
      if (status === "shipped") {
        await sendOrderShippedEmail({
          to: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          orderLabel,
          trackingNumber: updatedOrder.trackingNumber,
          carrier: updatedOrder.carrier,
          trackingUrl: getTrackingUrl(updatedOrder.carrier, updatedOrder.trackingNumber),
        });
      } else if (status === "delivered") {
        await sendOrderDeliveredEmail({
          to: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          orderLabel,
          siteUrl,
        });
      }
    } catch {
      // Email failure should never block the admin redirect — silently swallow
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account");
  revalidatePath(`/account/orders/${id}`);
  redirect(buildRedirect(`/admin/orders/${id}`, { saved: "1" }));
}

export async function updateManuscriptStatusAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Submission id");
  const status = requiredString(formData, "status", "Submission status");

  await db.manuscriptSubmission.update({
    where: { id },
    data: {
      status,
    },
  });

  revalidatePath("/admin/inbox/manuscripts");
  redirect(buildRedirect("/admin/inbox/manuscripts", { saved: "1" }));
}

export async function retryEmailJobAction(formData: FormData) {
  await requireAdminSession();

  const id = requiredString(formData, "id", "Email job id");

  await db.emailJob.update({
    where: { id },
    data: {
      status: "queued",
      attempts: 0,
      runAt: new Date(),
      lastError: null,
      failedAt: null,
    },
  });

  revalidatePath("/admin/email-jobs");
  redirect(buildRedirect("/admin/email-jobs", { notice: "Email job queued for retry." }));
}

export async function triggerEmailQueueDrainAction() {
  await requireAdminSession();

  const { processPendingEmailJobs } = await import("@/lib/email-jobs");

  try {
    const summary = await processPendingEmailJobs({ batchSize: 10, maxBatches: 2 });
    revalidatePath("/admin/email-jobs");
    redirect(
      buildRedirect("/admin/email-jobs", {
        notice: `Queue processed. Completed: ${summary.completedCount}, Failed: ${summary.failedCount}, Retried: ${summary.retriedCount}`,
      })
    );
  } catch (error) {
    console.error("Queue drain error:", error);
    redirect(buildRedirect("/admin/email-jobs", { error: "Failed to process email queue." }));
  }
}
