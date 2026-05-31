import { prisma } from '@/lib/prisma';
import { getUserTitle, calculateLevel } from '@/lib/title-calculator';

// ── Leaderboard ─────────────────────────────────────────────────────────────────

export async function getRoomLeaderboard(roomSlug: string) {
  const room = await prisma.room.findUnique({ where: { slug: roomSlug } });
  if (!room) return [];

  const stats = await prisma.roomStats.findMany({
    where: { roomId: room.id },
    include: {
      user: { select: { id: true, handle: true, displayName: true } },
    },
    orderBy: { totalMinutes: 'desc' },
    take: 10,
  });

  return stats.map((stat) => ({
    id: stat.userId,
    handle: stat.user.handle,
    displayName: stat.user.displayName,
    totalMinutes: stat.totalMinutes,
    title: getUserTitle(stat.totalMinutes),
  }));
}

// ── Activity grid ───────────────────────────────────────────────────────────────

export async function getUserStudyGrid(userId: string) {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const activities = await prisma.dailyActivity.findMany({
    where: { userId, date: { gte: oneYearAgo } },
    orderBy: { date: 'asc' },
  });

  return activities.map((a) => ({
    date: a.date.toISOString().split('T')[0],
    minutesStudied: a.minutesStudied,
    xpGained: a.xpGained,
    xpGoal: a.xpGoal,
  }));
}

// ── Streak ──────────────────────────────────────────────────────────────────────

export async function getUserStreak(userId: string) {
  const activities = await prisma.dailyActivity.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  if (activities.length === 0) return 0;

  let streak = 0;
  const currentDate = new Date(new Date().toISOString().split('T')[0]);
  let idx = 0;

  while (idx < activities.length) {
    const actDate = activities[idx].date.toISOString().split('T')[0];
    const expectedDateStr = currentDate.toISOString().split('T')[0];

    if (actDate === expectedDateStr) {
      if (activities[idx].xpGained > 0 || activities[idx].minutesStudied > 0) {
        streak++;
      } else if (idx !== 0) {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
      idx++;
    } else if (actDate > expectedDateStr) {
      idx++;
    } else {
      if (idx !== 0) break;
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  return streak;
}

// ── Focus session commit ───────────────────────────────────────────────────────

export async function commitFocusSession(userId: string, minutes: number) {
  const dateStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const parsedDate = new Date(dateStr);

  await prisma.$transaction([
    prisma.dailyActivity.upsert({
      where: { userId_date: { userId, date: parsedDate } },
      update: { minutesStudied: { increment: minutes } },
      create: { userId, date: parsedDate, minutesStudied: minutes },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: minutes * 2 } },
    }),
  ]);

  return { success: true };
}

// Re-export level calculator for convenience
export { getUserTitle, calculateLevel };