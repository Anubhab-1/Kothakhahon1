import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const PRISMA_CACHE_SIGNATURE = "email-jobs-v2";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
  prismaSignature?: string;
};

function createPool() {
  return new Pool({
    connectionString: env.DATABASE_URL,
  });
}

function createClient(pool: Pool) {
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasExpectedModels(client?: PrismaClient) {
  const candidate = client as PrismaClient & {
    user?: unknown;
    emailJob?: unknown;
  };

  return Boolean(candidate?.user && candidate?.emailJob);
}

const shouldReuseClient =
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaSignature === PRISMA_CACHE_SIGNATURE &&
  hasExpectedModels(globalForPrisma.prisma) &&
  globalForPrisma.prismaPool;

if (!shouldReuseClient && process.env.NODE_ENV !== "production") {
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  void globalForPrisma.prismaPool?.end().catch(() => undefined);
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaPool = undefined;
}

const pool = shouldReuseClient ? globalForPrisma.prismaPool! : createPool();

export const db = shouldReuseClient ? globalForPrisma.prisma! : createClient(pool);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaPool = pool;
  globalForPrisma.prismaSignature = PRISMA_CACHE_SIGNATURE;
}
