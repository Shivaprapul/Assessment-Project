/**
 * Database Client
 * 
 * Prisma client singleton for database operations.
 * Includes connection pooling and error handling.
 * 
 * @module lib/db
 */

/**
 * Database Client
 * 
 * Prisma client singleton for database operations.
 * Includes connection pooling and error handling.
 * 
 * Prisma 6: Direct database connection via DATABASE_URL
 * 
 * @module lib/db
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

