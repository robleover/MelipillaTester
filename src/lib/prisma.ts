import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  // connect_timeout: seconds to wait for initial DB connection (Render free DB can sleep)
  // pool_timeout: seconds to wait for a connection from the pool
  // connection_limit: limit connections for serverless/free tier
  return `${url}${separator}connect_timeout=30&pool_timeout=30&connection_limit=5`;
}

const prismaClientSingleton = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
