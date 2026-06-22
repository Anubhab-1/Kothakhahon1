import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const ip = await getClientIp();
  const { id } = await params;

  let bookId = id;

  try {
    const body = await request.json();
    if (body && typeof body.bookId === "string") {
      bookId = body.bookId;
    }
  } catch {
    // Ignore JSON parsing errors and fallback to URL param ID
  }

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  const rl = await checkRateLimit({
    key: `book-view:${ip}:${bookId}`,
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
  });

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many view requests. Please wait." },
      { status: 429 }
    );
  }

  try {
    await db.book.update({
      where: { id: bookId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
