import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import {
  queueNewsletterSubscriptionEmails,
  runEmailJobsAfterResponse,
} from "@/lib/email-jobs";

const newsletterSchema = z.object({
  email: z.string().email(),
});

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit({
    key: `newsletter:${clientId}`,
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many subscription attempts. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  let payload: z.infer<typeof newsletterSchema>;
  try {
    payload = newsletterSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid newsletter payload." }, { status: 400 });
  }

  const subscriber = await db.newsletterSubscriber.upsert({
    where: { email: payload.email.toLowerCase() },
    update: { isActive: true },
    create: {
      email: payload.email.toLowerCase(),
      isActive: true,
    },
  });

  try {
    await queueNewsletterSubscriptionEmails({
      newsletterSubscriberId: subscriber.id,
      eventKey: `${subscriber.id}:${subscriber.updatedAt.getTime()}`,
    });
    runEmailJobsAfterResponse();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Newsletter email job enqueue failed.",
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
