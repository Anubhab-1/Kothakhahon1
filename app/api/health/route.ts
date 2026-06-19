import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Perform database connection test to ensure Postgres is up and responsive
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", database: "connected" }, { status: 200 });
  } catch (error) {
    logger.error("Health check database probe failed", error);
    return NextResponse.json({ status: "unhealthy", database: "error" }, { status: 500 });
  }
}
