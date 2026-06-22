import { db } from "./db";
import { Prisma } from "@/generated/prisma/client";

export function buildBookSearchVector(book: {
  title: string;
  titleEn?: string | null;
  synopsis?: string | null;
  author?: { name: string } | null;
  genres?: { genre: { name: string } }[];
}): string {
  const parts = [
    book.title,
    book.titleEn,
    book.synopsis,
    book.author?.name,
    ...(book.genres?.map(g => g.genre.name) ?? []),
  ].filter(Boolean);
  return parts.join(" ");
}

export async function updateBookSearchVector(bookId: string, tx?: Prisma.TransactionClient) {
  const client = tx || db;

  try {
    const book = await client.book.findUnique({
      where: { id: bookId },
      include: {
        author: {
          select: { name: true },
        },
        genres: {
          include: {
            genre: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!book) return;

    const searchVector = buildBookSearchVector(book);

    await client.book.update({
      where: { id: bookId },
      data: {
        searchVector,
      },
    });
  } catch (error) {
    console.error(`Failed to update search vector for book ${bookId}:`, error);
  }
}
