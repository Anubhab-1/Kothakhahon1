import { db } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const [emailArg, passwordArg, ...nameParts] = process.argv.slice(2);
  const email = (emailArg ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = (passwordArg ?? process.env.ADMIN_PASSWORD ?? "").trim();
  const fullName = (nameParts.join(" ") || process.env.ADMIN_NAME || "").trim();

  if (!email || !password) {
    throw new Error(
      "Usage: npm run admin:create -- <email> <password> \"Full Name\"",
    );
  }

  const admin = await db.user.upsert({
    where: {
      email,
    },
    update: {
      passwordHash: hashPassword(password),
      fullName: fullName || null,
      role: "ADMIN",
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash: hashPassword(password),
      fullName: fullName || null,
      role: "ADMIN",
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed to create admin.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
