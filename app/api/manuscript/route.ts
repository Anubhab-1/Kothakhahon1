import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import {
  queueManuscriptSubmissionEmails,
  runEmailJobsAfterResponse,
} from "@/lib/email-jobs";

const manuscriptSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  city: z.string().min(2),
  manuscriptTitle: z.string().min(2),
  genre: z.string().min(2),
  wordCount: z.number().int().min(1000).max(400000),
  language: z.string().min(2),
  synopsis: z.string().min(120).max(4000),
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
    key: `manuscript:${clientId}`,
    limit: 4,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many manuscript submissions. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  let payload: z.infer<typeof manuscriptSchema>;
  try {
    payload = manuscriptSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid manuscript payload." }, { status: 400 });
  }

  const submission = await db.manuscriptSubmission.create({
    data: {
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      city: payload.city,
      manuscriptTitle: payload.manuscriptTitle,
      genre: payload.genre,
      wordCount: payload.wordCount,
      language: payload.language,
      synopsis: payload.synopsis,
    },
  });

  try {
    await queueManuscriptSubmissionEmails(submission.id);
    runEmailJobsAfterResponse();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Manuscript email job enqueue failed.",
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
