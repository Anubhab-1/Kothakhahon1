import { z } from "zod";

type ReadinessStatus = "ready" | "warning" | "blocked";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const defaultDatabaseUrl =
  process.env.NODE_ENV === "production"
    ? "postgresql://user:password@host:5432/kothakhahon?schema=public"
    : "postgresql://postgres@localhost:54329/kothakhahon_dev?schema=public";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().default(rawSiteUrl),
  DATABASE_URL: z.string().default(defaultDatabaseUrl),
  DIRECT_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().optional(),
  EMAIL_JOB_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: rawSiteUrl,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
  EMAIL_JOB_SECRET: process.env.EMAIL_JOB_SECRET,
});

function normalizeSiteUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return new URL("http://localhost:3000");
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getDatabaseEngine(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return "sqlite";
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return "postgres";
  }

  return "other";
}

function isLocalDatabase(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return isLocalHost(url.hostname);
  } catch {
    return false;
  }
}

const siteUrl = normalizeSiteUrl(parsedEnv.NEXT_PUBLIC_SITE_URL);
const databaseEngine = getDatabaseEngine(parsedEnv.DATABASE_URL);
const databaseIsLocal = isLocalDatabase(parsedEnv.DATABASE_URL);

export const env = {
  ...parsedEnv,
  SITE_URL: siteUrl,
  DATABASE_ENGINE: databaseEngine,
  DATABASE_IS_LOCAL: databaseIsLocal,
};

export function getSiteUrl() {
  return env.SITE_URL;
}

export function getSiteUrlString() {
  return getSiteUrl().toString().replace(/\/$/, "");
}

export function getLaunchReadiness() {
  const items: Array<{
    key: string;
    label: string;
    status: ReadinessStatus;
    detail: string;
  }> = [];

  items.push({
    key: "site-url",
    label: "Canonical Site URL",
    status: isLocalHost(siteUrl.hostname) ? "blocked" : "ready",
    detail: isLocalHost(siteUrl.hostname)
      ? "NEXT_PUBLIC_SITE_URL still points to localhost."
      : `Canonical URL is ${getSiteUrlString()}.`,
  });

  items.push({
    key: "database",
    label: "Production Database",
    status: databaseEngine === "postgres" && !databaseIsLocal ? "ready" : "blocked",
    detail:
      databaseEngine === "postgres" && !databaseIsLocal
        ? "DATABASE_URL points to a managed PostgreSQL instance."
        : "DATABASE_URL still points to a local or non-production database. Move runtime and direct connections to managed Postgres before launch.",
  });

  const razorpayReady = Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      env.RAZORPAY_WEBHOOK_SECRET,
  );
  items.push({
    key: "razorpay",
    label: "Razorpay",
    status: razorpayReady ? "ready" : "warning",
    detail: razorpayReady
      ? "Server keys, public key, and webhook secret are configured."
      : env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        ? "Razorpay checkout keys are configured, but RAZORPAY_WEBHOOK_SECRET is still missing."
        : "Razorpay keys are incomplete. Online payments are unavailable, but cash on delivery can still operate.",
  });

  const cloudinaryReady = Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );

  items.push({
    key: "cloudinary",
    label: "Image Uploads",
    status: cloudinaryReady ? "ready" : "warning",
    detail: cloudinaryReady
      ? "Cloudinary cloud name and server credentials are configured."
      : "Cloudinary is not fully configured yet. Admin can still use direct URLs, but uploads are not production-ready.",
  });

  const resendReady = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
  const emailJobsReady = process.env.NODE_ENV !== "production" || Boolean(env.EMAIL_JOB_SECRET);

  items.push({
    key: "resend",
    label: "Transactional Email",
    status: resendReady ? "ready" : "warning",
    detail: resendReady
      ? "Resend API key and sender identity are configured."
      : env.RESEND_API_KEY
        ? "Resend API key exists, but RESEND_FROM_EMAIL is still missing. Production email sends need a verified sender address."
      : "Resend is not configured yet. Order and inbox notifications are still local-only.",
  });

  items.push({
    key: "email-jobs",
    label: "Email Job Worker",
    status: emailJobsReady ? "ready" : "warning",
    detail: emailJobsReady
      ? process.env.NODE_ENV === "production"
        ? "Protected email job processor secret is configured."
        : "Local development can process queued email jobs without an extra shared secret."
      : "EMAIL_JOB_SECRET is missing. Configure it before exposing the background email processor in production.",
  });

  return items;
}
