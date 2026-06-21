import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSiteUrlString } from "@/lib/env";
import { queueVerificationEmail, runEmailJobsAfterResponse } from "@/lib/email-jobs";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rl = await checkRateLimit({
    key: `api-resend-verification:${ip}`,
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many verification link requests. Please try again in an hour." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerifiedAt: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Account not found or inactive." }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ error: "Email address is already verified." }, { status: 400 });
    }

    await db.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.emailVerificationToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    });

    const verificationUrl = `${getSiteUrlString()}/verify-email?token=${token}`;
    try {
      await queueVerificationEmail(normalizedEmail, verificationUrl);
      runEmailJobsAfterResponse();
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    }

    return NextResponse.json({ success: true, message: "Verification link sent successfully." });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
