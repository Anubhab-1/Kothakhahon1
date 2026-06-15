"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, clearSession, requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email";
import { getSiteUrlString } from "@/lib/env";

async function claimOrdersForUser(userId: string, email: string) {
  await db.order.updateMany({
    where: {
      userId: null,
      customerEmail: email,
    },
    data: {
      userId,
    },
  });
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function buildRedirect(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function getSafeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

export async function loginAction(formData: FormData) {
  const email = optionalString(formData, "email").toLowerCase();
  const password = optionalString(formData, "password");
  const next = getSafeNextPath(optionalString(formData, "next"));

  if (!email || !password) {
    redirect(buildRedirect("/login", { error: "Email and password are required.", next }));
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect(buildRedirect("/login", { error: "Invalid email or password.", next }));
  }

  await createSession(user);
  await claimOrdersForUser(user.id, user.email);
  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  if (next) {
    if (next.startsWith("/admin") && user.role !== "ADMIN") {
      redirect("/account?notice=Admin%20access%20is%20restricted%20to%20staff%20accounts.");
    }
    redirect(next);
  }

  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function registerAction(formData: FormData) {
  const fullName = optionalString(formData, "fullName");
  const email = optionalString(formData, "email").toLowerCase();
  const password = optionalString(formData, "password");
  const confirmPassword = optionalString(formData, "confirmPassword");

  if (!fullName || !email || !password || !confirmPassword) {
    redirect(buildRedirect("/register", { error: "All fields are required." }));
  }

  if (password.length < 8) {
    redirect(buildRedirect("/register", { error: "Password must be at least 8 characters." }));
  }

  if (password !== confirmPassword) {
    redirect(buildRedirect("/register", { error: "Passwords do not match." }));
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect(buildRedirect("/register", { error: "An account with this email already exists." }));
  }

  const user = await db.user.create({
    data: {
      email,
      fullName,
      passwordHash: hashPassword(password),
      role: "CUSTOMER",
      isActive: true,
    },
  });

  await createSession(user);
  await claimOrdersForUser(user.id, user.email);
  redirect("/account?notice=Welcome%20to%20Kothakhahon.");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login?notice=You%20have%20been%20signed%20out.");
}

export async function updateAccountProfileAction(formData: FormData) {
  const session = await requireSession("/account");
  const fullName = optionalString(formData, "fullName");
  const newPassword = optionalString(formData, "newPassword");
  const confirmPassword = optionalString(formData, "confirmPassword");

  if (!fullName) {
    redirect("/account?error=Full%20name%20is%20required.");
  }

  if (newPassword || confirmPassword) {
    if (newPassword.length < 8) {
      redirect("/account?error=New%20password%20must%20be%20at%20least%208%20characters.");
    }

    if (newPassword !== confirmPassword) {
      redirect("/account?error=Password%20confirmation%20does%20not%20match.");
    }
  }

  const updatedUser = await db.user.update({
    where: { id: session.userId },
    data: {
      fullName,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
  });

  await createSession(updatedUser);
  revalidatePath("/account");
  revalidatePath("/account/orders");
  redirect("/account?notice=Profile%20updated.");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = optionalString(formData, "email").toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=Please%20enter%20your%20email%20address.");
  }

  // Always show success to prevent email enumeration
  const user = await db.user.findUnique({ where: { email }, select: { id: true, isActive: true } });

  if (user?.isActive) {
    // Invalidate any existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const resetUrl = `${getSiteUrlString()}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail({ to: email, resetUrl });
    } catch {
      // Silently fail — don't expose email issues to user
    }
  }

  redirect(
    "/forgot-password?notice=If%20that%20email%20is%20registered%2C%20a%20reset%20link%20has%20been%20sent.",
  );
}

export async function resetPasswordAction(formData: FormData) {
  const token = optionalString(formData, "token");
  const newPassword = optionalString(formData, "newPassword");
  const confirmPassword = optionalString(formData, "confirmPassword");

  if (!token) {
    redirect("/forgot-password?error=Invalid%20or%20missing%20reset%20token.");
  }

  if (!newPassword || !confirmPassword) {
    redirect(`/reset-password?token=${token}&error=Both%20password%20fields%20are%20required.`);
  }

  if (newPassword.length < 8) {
    redirect(`/reset-password?token=${token}&error=Password%20must%20be%20at%20least%208%20characters.`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/reset-password?token=${token}&error=Passwords%20do%20not%20match.`);
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    redirect("/forgot-password?error=This%20reset%20link%20has%20expired%20or%20already%20been%20used.%20Please%20request%20a%20new%20one.");
  }

  const user = await db.user.findUnique({
    where: { email: resetToken.email },
  });

  if (!user || !user.isActive) {
    redirect("/login?error=Account%20not%20found.");
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    }),
    db.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?notice=Password%20updated%20successfully.%20Please%20sign%20in.");
}
