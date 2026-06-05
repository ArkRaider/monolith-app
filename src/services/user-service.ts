import { cache } from 'react';
import { prisma } from '@/lib/prisma';

// ── Single source of truth: ensureUserExists ────────────────────────────────────
// Every server action and API route that needs a user row calls this.
// Uses React cache() so multiple calls within a single HTTP request hit DB once.

interface ClerkUserLike {
  id: string;
  emailAddresses?: { emailAddress: string }[] | undefined;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  imageUrl?: string | null | undefined;
}

export async function ensureUserExists(user: ClerkUserLike) {
  const email =
    user.emailAddresses?.[0]?.emailAddress ?? `${user.id}@unknown.local`;
  const displayName =
    user.firstName || user.username || email.split('@')[0] || 'Unknown';
  const handle =
    user.username ||
    (user.firstName
      ? `${user.firstName.toLowerCase()}_${user.id.slice(-5)}`
      : `user_${user.id.slice(-8)}`);

  return prisma.user.upsert({
    where: { id: user.id },
    update: { lastActive: new Date() },
    create: {
      id: user.id,
      email,
      displayName,
      handle,
      avatarUrl: user.imageUrl ?? null,
      lastActive: new Date(),
    },
  });
}

// ── Cached reads — React cache() deduplicates within a single request ───────────

export const getUserById = cache(async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } });
});

export const getUserByHandle = cache(async (handle: string) => {
  return prisma.user.findUnique({ where: { handle } });
});

// ── Uncached reads (for polling endpoints that need fresh data) ─────────────────

export async function getRecentUsers(limit = 10) {
  return prisma.user.findMany({
    orderBy: { lastActive: 'desc' },
    take: limit,
    select: {
      id: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      lastActive: true,
    },
  });
}

export async function getUserProfile(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      instagram: true,
      twitter: true,
      github: true,
      bannerUrl: true,
      currentGrind: true,
      whatImBuilding: true,
      location: true,
      timezone: true,
      currentMood: true,
      favoriteMusic: true,
      deepWorkHours: true,
      setupDetails: true,
      programmingTools: true,
      activeGoals: true,
      customLinks: true,
      lastActive: true,
      xp: true,
    },
  });
}