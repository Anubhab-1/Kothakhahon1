import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { EmailJobStatus, EmailJobType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
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

async function createEmailJob({
  type,
  payload,
  dedupeKey,
  runAt,
  maxAttempts = 5,
}: CreateEmailJobInput) {
  try {
    return await db.emailJob.create({
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
      return db.emailJob.findUnique({
        where: {
          dedupeKey,
        },
      });
    }

    throw error;
  }
}

async function createEmailJobs(inputs: CreateEmailJobInput[]) {
  return Promise.all(inputs.map((input) => createEmailJob(input)));
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

export async function queueCashOnDeliveryOrderEmails(orderId: string) {
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
  ]);
}

export async function queuePaidOrderEmails(orderId: string) {
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
  ]);
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
        console.error(
          `[email-job] ${job.type} failed on attempt ${job.attempts}: ${getErrorMessage(error)}`,
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
        console.error(`[email-job] background processing failed: ${getErrorMessage(error)}`);
      }
    });
  } catch (error) {
    console.error(`[email-job] could not schedule after-response processing: ${getErrorMessage(error)}`);
  }
}
