import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

interface BookViewRouteProps {
  params: Promise<{ slug: string }>;
}

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return `${ip}:${userAgent.slice(0, 80)}`;
}

export async function POST(request: Request, { params }: BookViewRouteProps) {
  const { slug } = await params;
  const rateLimit = await checkRateLimit({
    key: `book-view:${slug}:${getClientIdentifier(request)}`,
    limit: 1,
    windowMs: 30 * 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ tracked: false, reason: "rate_limited" });
  }

  await db.book.updateMany({
    where: { slug },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  return NextResponse.json({ tracked: true });
}
