import { db } from "./lib/db.js";
import { verifyPassword } from "./lib/auth/password.js";

async function check() {
  const user = await db.user.findUnique({ where: { email: "admin@kothakhahon.com" } });
  console.log("User found:", !!user);
  if (user) {
    console.log("Is Active:", user.isActive);
    console.log("Role:", user.role);
    console.log("Email verified:", !!user.emailVerifiedAt);
    
    const isValid = verifyPassword("KothakhahonAdmin123!", user.passwordHash);
    console.log("Password valid:", isValid);
  }
}

check().catch(console.error).finally(() => db.$disconnect());
