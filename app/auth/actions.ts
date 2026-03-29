"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, clearSession, requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

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
