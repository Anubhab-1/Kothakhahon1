import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { EmailJobStatus, EmailJobType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  sendCashOnDeliveryOrderAdminEmail,
  sendCashOnDeliveryOrderCustomerEmail,
  sendContactSubmissionAdminEmail,
  sendContactSubmissionCustomerEmail,
  sendManuscriptSubmissionAdminEmail,
  sendManuscriptSubmissionCustomerEmail,
  sendNewsletterSubscriptionAdminEmail,
  sendNewsletterSubscriptionCustomerEmail,
  sendPaidOrderAdminEmail,
  sendPaidOrderCustomerEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundedEmail,
  sendLowStockAdminEmail,
  sendFailedPaymentAdminEmail,
} from "@/lib/email";
import { z } from "zod";

const DEFAULT_BATCH_SIZE = 4;
const DEFAULT_MAX_BATCHES = 2;
const STALE_LOCK_MS = 15 * 60_000;

const contactMessagePayloadSchema = z.object({
  contactMessageId: z.string().min(1),
});

const manuscriptPayloadSchema = z.object({
  manuscriptSubmissionId: z.string().min(1),
});

const newsletterPayloadSchema = z.object({
  newsletterSubscriberId: z.string().min(1),
});

const orderPayloadSchema = z.object({
  orderId: z.string().min(1),
});

const verificationPayloadSchema = z.object({
  email: z.string().email(),
  verificationUrl: z.string().url(),
});

const welcomePayloadSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1),
});

const orderShippedPayloadSchema = z.object({
  orderId: z.string().min(1),
});

const orderDeliveredPayloadSchema = z.object({
  orderId: z.string().min(1),
  siteUrl: z.string().url(),
});

const orderRefundedPayloadSchema = z.object({
  orderId: z.string().min(1),
});

const lowStockPayloadSchema = z.object({
  bookId: z.string().min(1),
});

const failedPaymentPayloadSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string(),
});

class EmailJobDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailJobDataError";
  }
}

type CreateEmailJobInput = {
  type: EmailJobType;
  payload: Prisma.InputJsonValue;
  dedupeKey?: string;
  runAt?: Date;
  maxAttempts?: number;
};

type ClaimedEmailJobRow = {
  id: string;
  type: EmailJobType;
  payload: Prisma.JsonValue;
  attempts: number;
  maxAttempts: number;
};

type ProcessEmailJobsOptions = {
  batchSize?: number;
  maxBatches?: number;
};

function getRetryDelayMs(attempt: number) {
  if (attempt <= 1) {
    return 60_000;
  }

  if (attempt === 2) {
    return 5 * 60_000;
  }

  if (attempt === 3) {
    return 15 * 60_000;
  }

  return 60 * 60_000;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown email job failure.";
}

async function createEmailJob(
  {
    type,
    payload,
    dedupeKey,
    runAt,
    maxAttempts = 5,
  }: CreateEmailJobInput,
  tx?: Prisma.TransactionClient
) {
  const client = tx ? (tx as typeof db) : db;
  try {
    return await client.emailJob.create({
      data: {
        type,
        dedupeKey,
        payload,
        runAt,
        maxAttempts,
      },
    });
  } catch (error) {
    if (
      dedupeKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return client.emailJob.findUnique({
        where: {
          dedupeKey,
        },
      });
    }

    throw error;
  }
}

async function createEmailJobs(inputs: CreateEmailJobInput[], tx?: Prisma.TransactionClient) {
  return Promise.all(inputs.map((input) => createEmailJob(input, tx)));
}

async function claimEmailJobs({
  batchSize,
  workerId,
}: {
  batchSize: number;
  workerId: string;
}) {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);

  return db.$queryRaw<ClaimedEmailJobRow[]>`
    WITH next_jobs AS (
      SELECT "id"
      FROM "EmailJob"
      WHERE (
        "status" = CAST(${EmailJobStatus.queued} AS "EmailJobStatus")
        AND "runAt" <= NOW()
      ) OR (
        "status" = CAST(${EmailJobStatus.processing} AS "EmailJobStatus")
        AND "lockedAt" IS NOT NULL
        AND "lockedAt" <= ${staleBefore}
      )
      ORDER BY "runAt" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${batchSize}
    )
    UPDATE "EmailJob"
    SET
      "status" = CAST(${EmailJobStatus.processing} AS "EmailJobStatus"),
      "attempts" = "EmailJob"."attempts" + 1,
      "lockedAt" = NOW(),
      "lockedBy" = ${workerId},
      "updatedAt" = NOW(),
      "failedAt" = NULL
    FROM next_jobs
    WHERE "EmailJob"."id" = next_jobs."id"
    RETURNING
      "EmailJob"."id",
      "EmailJob"."type",
      "EmailJob"."payload",
      "EmailJob"."attempts",
      "EmailJob"."maxAttempts";
  `;
}

async function markEmailJobCompleted(id: string) {
  await db.emailJob.update({
    where: { id },
    data: {
      status: EmailJobStatus.completed,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      completedAt: new Date(),
      failedAt: null,
    },
  });
}

async function markEmailJobRetryQueued(id: string, attempts: number, error: unknown) {
  const nextRunAt = new Date(Date.now() + getRetryDelayMs(attempts));

  await db.emailJob.update({
    where: { id },
    data: {
      status: EmailJobStatus.queued,
      runAt: nextRunAt,
      lockedAt: null,
      lockedBy: null,
      lastError: getErrorMessage(error),
      completedAt: null,
      failedAt: null,
    },
  });
}

async function markEmailJobFailed(id: string, error: unknown) {
  await db.emailJob.update({
    where: { id },
    data: {
      status: EmailJobStatus.failed,
      lockedAt: null,
      lockedBy: null,
      lastError: getErrorMessage(error),
      completedAt: null,
      failedAt: new Date(),
    },
  });
}

async function getContactMessageOrThrow(id: string) {
  const message = await db.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new EmailJobDataError(`Contact message ${id} no longer exists.`);
  }

  return message;
}

async function getManuscriptSubmissionOrThrow(id: string) {
  const submission = await db.manuscriptSubmission.findUnique({
    where: { id },
  });

  if (!submission) {
    throw new EmailJobDataError(`Manuscript submission ${id} no longer exists.`);
  }

  return submission;
}

async function getNewsletterSubscriberOrThrow(id: string) {
  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { id },
  });

  if (!subscriber) {
    throw new EmailJobDataError(`Newsletter subscriber ${id} no longer exists.`);
  }

  return subscriber;
}

async function getOrderOrThrow(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new EmailJobDataError(`Order ${id} no longer exists.`);
  }

  return order;
}

function parsePayload<T>(schema: z.ZodSchema<T>, payload: Prisma.JsonValue, label: string) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new EmailJobDataError(`Invalid payload for ${label} email job.`);
  }

  return parsed.data;
}

async function processEmailJob(job: ClaimedEmailJobRow) {
  switch (job.type) {
    case EmailJobType.contact_customer: {
      const payload = parsePayload(
        contactMessagePayloadSchema,
        job.payload,
        "contact customer",
      );
      const message = await getContactMessageOrThrow(payload.contactMessageId);
      await sendContactSubmissionCustomerEmail(message);
      return;
    }

    case EmailJobType.contact_admin: {
      const payload = parsePayload(contactMessagePayloadSchema, job.payload, "contact admin");
      const message = await getContactMessageOrThrow(payload.contactMessageId);
      await sendContactSubmissionAdminEmail(message);
      return;
    }

    case EmailJobType.manuscript_customer: {
      const payload = parsePayload(
        manuscriptPayloadSchema,
        job.payload,
        "manuscript customer",
      );
      const submission = await getManuscriptSubmissionOrThrow(
        payload.manuscriptSubmissionId,
      );
      await sendManuscriptSubmissionCustomerEmail(submission);
      return;
    }

    case EmailJobType.manuscript_admin: {
      const payload = parsePayload(
        manuscriptPayloadSchema,
        job.payload,
        "manuscript admin",
      );
      const submission = await getManuscriptSubmissionOrThrow(
        payload.manuscriptSubmissionId,
      );
      await sendManuscriptSubmissionAdminEmail(submission);
      return;
    }

    case EmailJobType.newsletter_customer: {
      const payload = parsePayload(
        newsletterPayloadSchema,
        job.payload,
        "newsletter customer",
      );
      const subscriber = await getNewsletterSubscriberOrThrow(
        payload.newsletterSubscriberId,
      );
      await sendNewsletterSubscriptionCustomerEmail(subscriber);
      return;
    }

    case EmailJobType.newsletter_admin: {
      const payload = parsePayload(
        newsletterPayloadSchema,
        job.payload,
        "newsletter admin",
      );
      const subscriber = await getNewsletterSubscriberOrThrow(
        payload.newsletterSubscriberId,
      );
      await sendNewsletterSubscriptionAdminEmail(subscriber);
      return;
    }

    case EmailJobType.cod_order_customer: {
      const payload = parsePayload(orderPayloadSchema, job.payload, "COD order customer");
      const order = await getOrderOrThrow(payload.orderId);
      await sendCashOnDeliveryOrderCustomerEmail(order);
      return;
    }

    case EmailJobType.cod_order_admin: {
      const payload = parsePayload(orderPayloadSchema, job.payload, "COD order admin");
      const order = await getOrderOrThrow(payload.orderId);
      await sendCashOnDeliveryOrderAdminEmail(order);
      return;
    }

    case EmailJobType.paid_order_customer: {
      const payload = parsePayload(orderPayloadSchema, job.payload, "paid order customer");
      const order = await getOrderOrThrow(payload.orderId);
      await sendPaidOrderCustomerEmail(order);
      return;
    }

    case EmailJobType.paid_order_admin: {
      const payload = parsePayload(orderPayloadSchema, job.payload, "paid order admin");
      const order = await getOrderOrThrow(payload.orderId);
      await sendPaidOrderAdminEmail(order);
      return;
    }

    case EmailJobType.verification_email: {
      const payload = parsePayload(
        verificationPayloadSchema,
        job.payload,
        "verification email",
      );
      await sendVerificationEmail({
        to: payload.email,
        verificationUrl: payload.verificationUrl,
      });
      return;
    }

    case EmailJobType.welcome_email: {
      const payload = parsePayload(
        welcomePayloadSchema,
        job.payload,
        "welcome email",
      );
      await sendWelcomeEmail({
        to: payload.email,
        customerName: payload.customerName,
      });
      return;
    }

    case EmailJobType.order_shipped: {
      const payload = parsePayload(
        orderShippedPayloadSchema,
        job.payload,
        "order shipped",
      );
      const order = await getOrderOrThrow(payload.orderId);
      const orderLabel = `#${order.id.slice(-8).toUpperCase()}`;
      
      const getTrackingUrl = (carrierName?: string | null, trackingNo?: string | null) => {
        if (!carrierName || !trackingNo) return null;
        const c = carrierName.toLowerCase().trim();
        if (c === "delhivery") return `https://www.delhivery.com/track/package/${trackingNo.trim()}`;
        if (c === "dhl") return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNo.trim()}`;
        if (c === "fedex") return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNo.trim()}`;
        return null;
      };

      await sendOrderShippedEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderLabel,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        trackingUrl: getTrackingUrl(order.carrier, order.trackingNumber),
      });
      return;
    }

    case EmailJobType.order_delivered: {
      const payload = parsePayload(
        orderDeliveredPayloadSchema,
        job.payload,
        "order delivered",
      );
      const order = await getOrderOrThrow(payload.orderId);
      const orderLabel = `#${order.id.slice(-8).toUpperCase()}`;
      await sendOrderDeliveredEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderLabel,
        siteUrl: payload.siteUrl,
      });
      return;
    }

    case EmailJobType.order_refunded: {
      const payload = parsePayload(
        orderRefundedPayloadSchema,
        job.payload,
        "order refunded",
      );
      const order = await getOrderOrThrow(payload.orderId);
      const orderLabel = `#${order.id.slice(-8).toUpperCase()}`;
      await sendOrderRefundedEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderLabel,
        amount: order.totalAmount,
      });
      return;
    }

    case EmailJobType.low_stock_admin: {
      const payload = parsePayload(
        lowStockPayloadSchema,
        job.payload,
        "low stock admin",
      );
      const book = await db.book.findUnique({
        where: { id: payload.bookId },
      });
      if (!book) {
        throw new EmailJobDataError(`Book ${payload.bookId} no longer exists.`);
      }
      await sendLowStockAdminEmail({
        bookTitle: book.title,
        stockQuantity: book.stockQuantity,
        threshold: book.lowStockThreshold,
      });
      return;
    }

    case EmailJobType.failed_payment_admin: {
      const payload = parsePayload(
        failedPaymentPayloadSchema,
        job.payload,
        "failed payment admin",
      );
      const order = await getOrderOrThrow(payload.orderId);
      const orderLabel = `#${order.id.slice(-8).toUpperCase()}`;
      await sendFailedPaymentAdminEmail({
        orderLabel,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        reason: payload.reason,
      });
      return;
    }
  }
}

export async function queueContactSubmissionEmails(contactMessageId: string) {
  return createEmailJobs([
    {
      type: EmailJobType.contact_customer,
      payload: { contactMessageId },
      dedupeKey: `contact-customer:${contactMessageId}`,
    },
    {
      type: EmailJobType.contact_admin,
      payload: { contactMessageId },
      dedupeKey: `contact-admin:${contactMessageId}`,
    },
  ]);
}

export async function queueManuscriptSubmissionEmails(manuscriptSubmissionId: string) {
  return createEmailJobs([
    {
      type: EmailJobType.manuscript_customer,
      payload: { manuscriptSubmissionId },
      dedupeKey: `manuscript-customer:${manuscriptSubmissionId}`,
    },
    {
      type: EmailJobType.manuscript_admin,
      payload: { manuscriptSubmissionId },
      dedupeKey: `manuscript-admin:${manuscriptSubmissionId}`,
    },
  ]);
}

export async function queueNewsletterSubscriptionEmails({
  newsletterSubscriberId,
  eventKey,
}: {
  newsletterSubscriberId: string;
  eventKey: string;
}) {
  return createEmailJobs([
    {
      type: EmailJobType.newsletter_customer,
      payload: { newsletterSubscriberId },
      dedupeKey: `newsletter-customer:${eventKey}`,
    },
    {
      type: EmailJobType.newsletter_admin,
      payload: { newsletterSubscriberId },
      dedupeKey: `newsletter-admin:${eventKey}`,
    },
  ]);
}

export async function queueCashOnDeliveryOrderEmails(orderId: string, tx?: Prisma.TransactionClient) {
  return createEmailJobs([
    {
      type: EmailJobType.cod_order_customer,
      payload: { orderId },
      dedupeKey: `cod-order-customer:${orderId}`,
    },
    {
      type: EmailJobType.cod_order_admin,
      payload: { orderId },
      dedupeKey: `cod-order-admin:${orderId}`,
    },
  ], tx);
}

export async function queuePaidOrderEmails(orderId: string, tx?: Prisma.TransactionClient) {
  return createEmailJobs([
    {
      type: EmailJobType.paid_order_customer,
      payload: { orderId },
      dedupeKey: `paid-order-customer:${orderId}`,
    },
    {
      type: EmailJobType.paid_order_admin,
      payload: { orderId },
      dedupeKey: `paid-order-admin:${orderId}`,
    },
  ], tx);
}

export async function queueVerificationEmail(email: string, verificationUrl: string) {
  return createEmailJob({
    type: EmailJobType.verification_email,
    payload: { email, verificationUrl },
    dedupeKey: `verification:${email}:${Buffer.from(verificationUrl).toString("base64url").slice(0, 32)}`,
  });
}

export async function queueWelcomeEmail(email: string, customerName: string) {
  return createEmailJob({
    type: EmailJobType.welcome_email,
    payload: { email, customerName },
    dedupeKey: `welcome:${email}`,
  });
}

export async function queueOrderShippedEmail(orderId: string) {
  return createEmailJob({
    type: EmailJobType.order_shipped,
    payload: { orderId },
    dedupeKey: `order-shipped:${orderId}`,
  });
}

export async function queueOrderDeliveredEmail(orderId: string, siteUrl: string) {
  return createEmailJob({
    type: EmailJobType.order_delivered,
    payload: { orderId, siteUrl },
    dedupeKey: `order-delivered:${orderId}`,
  });
}

export async function queueOrderRefundedEmail(orderId: string) {
  return createEmailJob({
    type: EmailJobType.order_refunded,
    payload: { orderId },
    dedupeKey: `order-refunded:${orderId}`,
  });
}

export async function queueLowStockAdminEmail(bookId: string, tx?: Prisma.TransactionClient) {
  return createEmailJob({
    type: EmailJobType.low_stock_admin,
    payload: { bookId },
    dedupeKey: `low-stock:${bookId}:${new Date().toDateString()}`,
  }, tx);
}

export async function queueFailedPaymentAdminEmail(orderId: string, reason: string) {
  return createEmailJob({
    type: EmailJobType.failed_payment_admin,
    payload: { orderId, reason },
    dedupeKey: `failed-payment:${orderId}`,
  });
}

export async function processPendingEmailJobs({
  batchSize = DEFAULT_BATCH_SIZE,
  maxBatches = DEFAULT_MAX_BATCHES,
}: ProcessEmailJobsOptions = {}) {
  const workerId = `email-worker:${crypto.randomUUID()}`;
  const summary = {
    processedCount: 0,
    completedCount: 0,
    retriedCount: 0,
    failedCount: 0,
  };

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const jobs = await claimEmailJobs({ batchSize, workerId });
    if (jobs.length === 0) {
      break;
    }

    for (const job of jobs) {
      summary.processedCount += 1;

      try {
        await processEmailJob(job);
        await markEmailJobCompleted(job.id);
        summary.completedCount += 1;
      } catch (error) {
        logger.error(
          `[email-job] ${job.type} failed on attempt ${job.attempts}`,
          error,
          { jobId: job.id, type: job.type, attempt: job.attempts }
        );

        if (error instanceof EmailJobDataError || job.attempts >= job.maxAttempts) {
          await markEmailJobFailed(job.id, error);
          summary.failedCount += 1;
          continue;
        }

        await markEmailJobRetryQueued(job.id, job.attempts, error);
        summary.retriedCount += 1;
      }
    }

    if (jobs.length < batchSize) {
      break;
    }
  }

  return summary;
}

export function runEmailJobsAfterResponse(options?: ProcessEmailJobsOptions) {
  try {
    after(async () => {
      try {
        await processPendingEmailJobs(options);
      } catch (error) {
        logger.error("[email-job] background processing failed", error);
      }
    });
  } catch (error) {
    logger.error("[email-job] could not schedule after-response processing", error);
  }
}
