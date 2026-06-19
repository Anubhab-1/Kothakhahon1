import { db } from "../lib/db";

async function main() {
  const result = await db.user.updateMany({
    where: {
      emailVerifiedAt: null,
    },
    data: {
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Successfully marked ${result.count} existing user(s) as email-verified.`);
}

main()
  .catch((e) => {
    console.error("Verification script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
