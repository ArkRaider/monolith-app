import { prisma } from '@/lib/prisma';

export async function getXpState(userId: string) {
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, xp: true },
  });

  if (!userRow) {
    return { gained: 0, goal: 100, total: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const parsedDate = new Date(todayStr);

  const activity = await prisma.dailyActivity.findUnique({
    where: { userId_date: { userId, date: parsedDate } },
  });

  return {
    gained: activity?.xpGained ?? 0,
    goal: activity?.xpGoal ?? 100,
    total: userRow.xp,
  };
}

/**
 * Apply XP from a GoalItem toggle. Server-authoritative — the XP amount
 * comes from the stored xpWeight, not from client input.
 */
export async function applyGoalXp(
  userId: string,
  goalId: string,
  isCompleting: boolean
) {
  const goal = await prisma.goalItem.findUnique({
    where: { id: goalId },
    select: { id: true, userId: true, xpWeight: true, isCompleted: true },
  });

  if (!goal || goal.userId !== userId) {
    throw new Error('Goal not found or not owned by user');
  }

  // Idempotency
  if (isCompleting && goal.isCompleted) return { xpDelta: 0, total: 0 };
  if (!isCompleting && !goal.isCompleted) return { xpDelta: 0, total: 0 };

  const xpDelta = isCompleting ? goal.xpWeight : -goal.xpWeight;

  const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const parsedDate = new Date(todayStr);

  const [, updatedUser] = await prisma.$transaction([
    prisma.goalItem.update({
      where: { id: goalId },
      data: {
        isCompleted: isCompleting,
        completedAt: isCompleting ? new Date() : null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpDelta } },
    }),
  ]);

  try {
    await prisma.dailyActivity.upsert({
      where: { userId_date: { userId, date: parsedDate } },
      update: { xpGained: { increment: xpDelta } },
      create: { userId, date: parsedDate, xpGained: Math.max(0, xpDelta) },
    });
  } catch (e) {
    console.error('[xp-service] DailyActivity upsert failed (non-fatal):', e);
  }

  return { xpDelta, total: updatedUser.xp };
}