import { db } from "../lib/db";
import { buildBookSearchVector } from "../lib/search";

async function main() {
  console.log("Backfilling search vectors for all books...");

  const books = await db.book.findMany({
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

  console.log(`Found ${books.length} books to process.`);

  let updatedCount = 0;

  for (const book of books) {
    const searchVector = buildBookSearchVector(book);
    await db.book.update({
      where: { id: book.id },
      data: { searchVector },
    });
    updatedCount++;
  }

  console.log(`Successfully updated search vectors for ${updatedCount} books!`);
}

main()
  .catch((error) => {
    console.error("Failed to backfill search vectors:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
