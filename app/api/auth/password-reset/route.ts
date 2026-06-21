import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSiteUrlString } from "@/lib/env";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rl = await checkRateLimit({
    key: `api-password-reset:${ip}`,
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Please try again in an hour." },
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
      select: { id: true, isActive: true },
    });

    if (user?.isActive) {
      await db.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordResetToken.create({
        data: { email: normalizedEmail, token, expiresAt },
      });

      const resetUrl = `${getSiteUrlString()}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If the email is registered, a password reset link has been sent.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
