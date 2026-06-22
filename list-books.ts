import { db } from "./lib/db.js";

async function listBooks() {
  const books = await db.book.findMany({
    select: { title: true, slug: true }
  });
  console.log("Books in DB:");
  books.forEach(b => console.log(`- ${b.title} (slug: ${b.slug})`));
}

listBooks().catch(console.error).finally(() => db.$disconnect());
