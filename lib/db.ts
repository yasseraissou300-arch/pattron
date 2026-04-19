import { PrismaClient } from "@prisma/client"

// Singleton Prisma pour éviter trop de connexions en développement hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
