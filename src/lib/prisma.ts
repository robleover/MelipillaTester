import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=300&pool_timeout=300`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
