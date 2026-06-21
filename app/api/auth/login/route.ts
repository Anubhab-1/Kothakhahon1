import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rl = await checkRateLimit({
    key: `api-login:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "Please verify your email address before logging in." }, { status: 403 });
    }

    // Regenerate session ID to prevent session fixation
    await clearSession();
    await createSession(user);

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
