import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: "unknown" as "connected" | "error" | "not_configured",
    redis: "unknown" as "connected" | "error" | "not_configured",
    timestamp: new Date().toISOString(),
  };

  // Database check
  if (!process.env.DATABASE_URL) {
    checks.database = "not_configured";
  } else {
    try {
      await Promise.race([
        db.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 5000)),
      ]);
      checks.database = "connected";
    } catch (error) {
      logger.error("Health check database probe failed", error);
      checks.database = "error";
    }
  }

  // Redis check (optional)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    checks.redis = "not_configured";
  } else {
    try {
      const res = await fetch(`${redisUrl}/get/health-check`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      checks.redis = res.ok ? "connected" : "error";
    } catch (error) {
      logger.error("Health check redis probe failed", error);
      checks.redis = "error";
    }
  }

  const isHealthy = checks.database === "connected";
  const status = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      ...checks,
    },
    { status }
  );
}
