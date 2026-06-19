import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { verifyCaptcha } from "@/lib/captcha";
import {
  queueContactSubmissionEmails,
  runEmailJobsAfterResponse,
} from "@/lib/email-jobs";

const contactSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  department: z.string().min(2),
  message: z.string().min(30).max(1800),
  captchaToken: z.string().optional().nullable(),
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
  const rateLimit = await checkRateLimit({
    key: `contact:${clientId}`,
    limit: 6,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many contact submissions. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  let payload: z.infer<typeof contactSchema>;
  try {
    payload = contactSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid contact payload." }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptcha(payload.captchaToken);
  if (!isCaptchaValid) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please try again." },
      { status: 400 }
    );
  }

  const message = await db.contactMessage.create({
    data: {
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      department: payload.department,
      message: payload.message,
    },
  });

  try {
    await queueContactSubmissionEmails(message.id);
    runEmailJobsAfterResponse();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Contact email job enqueue failed.",
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
