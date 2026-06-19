import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllBooks } from "@/lib/content";
import { checkRateLimit } from "@/lib/rate-limit";
import { Book } from "@/lib/types";
import Fuse from "fuse.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Rate limit: 30 searches per IP per minute
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const rl = await checkRateLimit({ key: `search:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ suggestions: [], queries: [] }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim().toLowerCase();
    const trending = searchParams.get("trending") === "true";

    // 1. Return trending searches if requested or query is empty
    if (trending || !query) {
      try {
        const trendingQueries = await db.searchQuery.findMany({
          orderBy: { count: "desc" },
          take: 5,
        });
        return NextResponse.json({
          queries: trendingQueries.map((q) => q.query),
          suggestions: [],
        });
      } catch (dbError) {
        console.error("Failed to fetch trending queries:", dbError);
        return NextResponse.json({ queries: [], suggestions: [] });
      }
    }

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [], queries: [] });
    }

    // 2. Fetch all books (will use DB if connected/seeded, fallback to seed data)
    let allBooks: Book[] = [];
    try {
      allBooks = await getAllBooks();
    } catch (err) {
      console.error("Failed to load books for search:", err);
    }

    if (!allBooks || allBooks.length === 0) {
      return NextResponse.json({ suggestions: [], queries: [] });
    }

    // 3. Map books to search corpus
    const searchCorpus = allBooks.map((book) => ({
      id: book._id,
      title: book.title,
      titleEn: book.titleEn ?? "",
      slug: book.slug,
      coverImageUrl: book.coverImageUrl ?? "",
      authorName: book.author?.name ?? "Unknown Author",
      genreNames: (book.genre ?? []).map((g) => g.name),
    }));

    // 4. Perform fuzzy search with Fuse.js
    const fuse = new Fuse(searchCorpus, {
      keys: [
        { name: "title", weight: 1.0 },
        { name: "titleEn", weight: 0.8 },
        { name: "authorName", weight: 0.8 },
        { name: "genreNames", weight: 0.4 },
      ],
      threshold: 0.35,
    });

    const results = fuse.search(query);
    const suggestions = results.slice(0, 6).map((r) => r.item);

    // 5. Track successful search term (1+ results and query length >= 2)
    if (suggestions.length > 0 && query.length >= 2) {
      try {
        await db.searchQuery.upsert({
          where: { query },
          update: { count: { increment: 1 } },
          create: { query, count: 1 },
        });
      } catch (dbError) {
        console.warn("Failed to log search query to database:", dbError);
      }
    }

    return NextResponse.json({ suggestions, queries: [] });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", suggestions: [], queries: [] }, { status: 500 });
  }
}

