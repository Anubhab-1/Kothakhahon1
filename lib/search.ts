import { db } from "./db";
import { Prisma } from "@/generated/prisma/client";

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

    const genreNames = book.genres.map((g) => g.genre.name).join(" ");
    const searchString = [
      book.title,
      book.titleEn ?? "",
      book.synopsis ?? "",
      book.author?.name ?? "",
      genreNames,
    ]
      .filter(Boolean)
      .join(" ");

    await client.book.update({
      where: { id: bookId },
      data: {
        searchVector: searchString,
      },
    });
  } catch (error) {
    console.error(`Failed to update search vector for book ${bookId}:`, error);
  }
}
