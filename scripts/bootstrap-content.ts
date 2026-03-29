import { bootstrapSeedContent } from "../lib/bootstrap-content";
import { db } from "../lib/db";

async function main() {
  const force = process.argv.includes("--force");
  const result = await bootstrapSeedContent({ force });

  if (!result.imported) {
    console.log(result.reason);
    return;
  }

  console.log(
    `Imported content. Authors: ${result.counts.authors}, Books: ${result.counts.books}, Posts: ${result.counts.posts}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed to import content.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
