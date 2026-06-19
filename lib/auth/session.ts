import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const SESSION_COOKIE = "kothakhahon_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export interface AuthSession {
  userId: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  expiresAt: number;
}

function getSessionSecret() {
  const configured = env.SESSION_SECRET;
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }

  return "local-session-secret";
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(session: AuthSession) {
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function decodeSession(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AuthSession;
    if (!parsed.userId || !parsed.email || !parsed.role || parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildLoginRedirect(target?: string) {
  if (!target) {
    return "/login";
  }

  // Only allow relative paths starting with / to prevent open redirect
  // e.g. reject ?next=https://evil.com or ?next=//evil.com
  const sanitized = target.startsWith("/") && !target.startsWith("//") ? target : "/login";
  return `/login?next=${encodeURIComponent(sanitized)}`;
}

export async function createSession(user: {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: UserRole;
}) {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName ?? undefined,
    phone: user.phone ?? undefined,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

declare global {
  var __mockSession: AuthSession | null | undefined;
}

export async function getSession() {
  if (globalThis.__mockSession !== undefined) {
    return globalThis.__mockSession;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    return decodeSession(token);
  } catch {
    return null;
  }
}

export async function requireSession(redirectTo?: string) {
  const session = await getSession();
  if (!session) {
    redirect(buildLoginRedirect(redirectTo));
  }
  return session;
}

export async function requireRole(role: UserRole, redirectTo?: string) {
  const session = await requireSession(redirectTo);
  if (session.role !== role) {
    if (role === "ADMIN") {
      redirect("/account?notice=Admin%20access%20is%20restricted%20to%20staff%20accounts.");
    }
    redirect("/account");
  }
  return session;
}
