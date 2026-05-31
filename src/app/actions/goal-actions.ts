'use server';

import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface GoalItemData {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  xpWeight: number;
  estimatedMinutes: number;
  complexity: string;
  createdAt: string;
}

// ── List goals for the current user ─────────────────────────────────────────────
export async function getUserGoals(): Promise<GoalItemData[]> {
  try {
    const user = await currentUser();
    if (!user) return [];

    const goals = await prisma.goalItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
      completedAt: g.completedAt?.toISOString() ?? null,
    }));
  } catch (error) {
    console.error('[goal-actions] getUserGoals error:', error);
    return [];
  }
}

// ── Create a new goal ───────────────────────────────────────────────────────────
export async function createGoal(data: {
  title: string;
  xpWeight: number;
  estimatedMinutes?: number;
  complexity?: string;
  roomId?: string;
}): Promise<GoalItemData | { error: string }> {
  try {
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    const goal = await prisma.goalItem.create({
      data: {
        userId: user.id,
        title: data.title,
        xpWeight: data.xpWeight,
        estimatedMinutes: data.estimatedMinutes ?? 25,
        complexity: data.complexity ?? 'MEDIUM',
        roomId: data.roomId ?? null,
      },
    });

    revalidatePath('/dashboard');
    return {
      ...goal,
      createdAt: goal.createdAt.toISOString(),
      completedAt: null,
    };
  } catch (error) {
    console.error('[goal-actions] createGoal error:', error);
    return { error: 'Failed to create goal' };
  }
}

// ── Toggle goal completion (server-authoritative XP) ────────────────────────────
export async function toggleGoalCompletion(
  goalId: string
): Promise<{ isCompleted: boolean; xpDelta: number; newXp: number } | { error: string }> {
  try {
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    const goal = await prisma.goalItem.findUnique({
      where: { id: goalId },
      select: { id: true, userId: true, xpWeight: true, isCompleted: true },
    });

    if (!goal) return { error: 'Goal not found' };
    if (goal.userId !== user.id) return { error: 'Not your goal' };

    const now = new Date();
    const xpDelta = goal.isCompleted ? -goal.xpWeight : goal.xpWeight;

    const todayStr = now.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const parsedDate = new Date(todayStr);

    const [updatedGoal, updatedUser] = await prisma.$transaction([
      prisma.goalItem.update({
        where: { id: goalId },
        data: {
          isCompleted: !goal.isCompleted,
          completedAt: goal.isCompleted ? null : now,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpDelta } },
      }),
    ]);

    // DailyActivity upsert (non-blocking)
    try {
      await prisma.dailyActivity.upsert({
        where: { userId_date: { userId: user.id, date: parsedDate } },
        update: { xpGained: { increment: xpDelta } },
        create: {
          userId: user.id,
          date: parsedDate,
          xpGained: Math.max(0, xpDelta),
        },
      });
    } catch (e) {
      console.error('[goal-actions] DailyActivity upsert failed (non-fatal):', e);
    }

    revalidatePath('/dashboard');
    return { isCompleted: updatedGoal.isCompleted, xpDelta, newXp: updatedUser.xp };
  } catch (error) {
    console.error('[goal-actions] toggleGoalCompletion error:', error);
    return { error: 'Failed to toggle goal' };
  }
}

// ── Delete a goal ───────────────────────────────────────────────────────────────
export async function deleteGoal(goalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const goal = await prisma.goalItem.findUnique({
      where: { id: goalId },
      select: { id: true, userId: true, isCompleted: true, xpWeight: true },
    });

    if (!goal) return { success: false, error: 'Goal not found' };
    if (goal.userId !== user.id) return { success: false, error: 'Not your goal' };

    // If the goal was completed, reverse the XP
    if (goal.isCompleted) {
      const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
      const parsedDate = new Date(todayStr);

      await prisma.$transaction([
        prisma.goalItem.delete({ where: { id: goalId } }),
        prisma.user.update({
          where: { id: user.id },
          data: { xp: { increment: -goal.xpWeight } },
        }),
      ]);

      try {
        await prisma.dailyActivity.upsert({
          where: { userId_date: { userId: user.id, date: parsedDate } },
          update: { xpGained: { increment: -goal.xpWeight } },
          create: { userId: user.id, date: parsedDate, xpGained: 0 },
        });
      } catch (e) {
        console.error('[goal-actions] DailyActivity upsert failed (non-fatal):', e);
      }
    } else {
      await prisma.goalItem.delete({ where: { id: goalId } });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[goal-actions] deleteGoal error:', error);
    return { success: false, error: 'Failed to delete goal' };
  }
}

// ── Clear all completed goals ───────────────────────────────────────────────────
export async function clearCompletedGoals(): Promise<number | { error: string }> {
  try {
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    const result = await prisma.goalItem.deleteMany({
      where: { userId: user.id, isCompleted: true },
    });

    revalidatePath('/dashboard');
    return result.count;
  } catch (error) {
    console.error('[goal-actions] clearCompletedGoals error:', error);
    return { error: 'Failed to clear completed goals' };
  }
}