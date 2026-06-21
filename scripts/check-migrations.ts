import { execSync } from "node:child_process";

function checkMigrations() {
  console.log("Checking migration status...");
  try {
    const output = execSync("npx prisma migrate status", { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] });
    console.log(output);

    if (output.toLowerCase().includes("not yet been applied") || output.toLowerCase().includes("not yet applied")) {
      console.error("Error: There are unapplied database migrations!");
      process.exit(1);
    }

    console.log("Migration check passed: All migrations are applied.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Migration check failed:", message);
    process.exit(1);
  }
}

checkMigrations();
