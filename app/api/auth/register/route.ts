import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSiteUrlString } from "@/lib/env";
import { queueVerificationEmail, runEmailJobsAfterResponse } from "@/lib/email-jobs";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rl = await checkRateLimit({
    key: `api-register:${ip}`,
    limit: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again in 15 minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const { fullName, email, password } = await request.json();
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    await db.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        passwordHash: hashPassword(password),
        role: "CUSTOMER",
        isActive: true,
      },
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
      console.error("Failed to queue verification email:", error);
    }

    return NextResponse.json({ success: true, message: "Registration successful. Please verify your email." });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
