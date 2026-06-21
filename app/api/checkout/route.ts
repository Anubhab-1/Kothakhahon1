import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

async function handle() {
  const ip = await getClientIp();
  const rl = await checkRateLimit({
    key: `api-checkout-root:${ip}`,
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout requests. Please wait before attempting again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  return NextResponse.json({ active: true });
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
