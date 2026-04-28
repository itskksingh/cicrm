import { PrismaClient } from "@prisma/client";

// ─── Prisma Client Singleton ───────────────────────────────────────────────
// In Next.js App Router (dev mode), hot-reload creates new module instances,
// which would exhaust the database connection pool without this global guard.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
