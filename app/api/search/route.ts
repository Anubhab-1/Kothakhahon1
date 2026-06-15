import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllBooks } from "@/lib/content";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Rate limit: 30 searches per IP per minute
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const rl = checkRateLimit({ key: `search:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim().toLowerCase();

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Attempt to search in the database first
    try {
      const dbBooks = await db.book.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { titleEn: { contains: query, mode: "insensitive" } },
            {
              author: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          ],
        },
        include: {
          author: true,
        },
        take: 6,
      });

      if (dbBooks.length > 0) {
        const suggestions = dbBooks.map((book) => ({
          id: book.id,
          title: book.title,
          titleEn: book.titleEn,
          slug: book.slug,
          coverImageUrl: book.coverImageUrl,
          authorName: book.author?.name ?? "Unknown Author",
        }));
        return NextResponse.json({ suggestions });
      }
    } catch (dbError) {
      console.warn("Search API failed database query, falling back to seed data:", dbError);
    }

    // Fallback to seeds if database has no records/is offline
    const allBooks = await getAllBooks();
    const filtered = allBooks
      .filter((book) => {
        const matchTitle = book.title.toLowerCase().includes(query);
        const matchTitleEn = book.titleEn?.toLowerCase().includes(query) ?? false;
        const matchAuthor = book.author?.name.toLowerCase().includes(query) ?? false;
        return matchTitle || matchTitleEn || matchAuthor;
      })
      .slice(0, 6)
      .map((book) => ({
        id: book._id,
        title: book.title,
        titleEn: book.titleEn,
        slug: book.slug,
        coverImageUrl: book.coverImageUrl,
        authorName: book.author?.name ?? "Unknown Author",
      }));

    return NextResponse.json({ suggestions: filtered });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
