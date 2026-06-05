import { PrismaClient } from '@prisma/client';

// ── Turbopack-safe singleton ──────────────────────────────────────────────────
// Next.js 16 + Turbopack hot-reloads can create multiple PrismaClient instances,
// exhausting PgBouncer's connection pool. We attach the client to `globalThis`
// so it survives HMR cycles in development.
//
// PgBouncer transaction-mode requires `connection_limit=1` per instance so that
// Prisma doesn't open more connections than the pooler allows.

declare global {
   
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
