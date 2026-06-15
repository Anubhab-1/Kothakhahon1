import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processPendingEmailJobs } from "@/lib/email-jobs";

function isAuthorized(request: Request) {
  const configuredSecret = env.EMAIL_JOB_SECRET?.trim();
  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${configuredSecret}`) {
    return true;
  }

  return request.headers.get("x-email-job-secret") === configuredSecret;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

async function handleProcessRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const batchSize = parsePositiveInteger(url.searchParams.get("batchSize"), 10);
  const maxBatches = parsePositiveInteger(url.searchParams.get("maxBatches"), 5);

  const summary = await processPendingEmailJobs({
    batchSize,
    maxBatches,
  });

  return NextResponse.json({
    success: true,
    ...summary,
  });
}

export async function GET(request: Request) {
  return handleProcessRequest(request);
}

export async function POST(request: Request) {
  return handleProcessRequest(request);
}
