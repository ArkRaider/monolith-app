'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getUserGoals,
  createGoal,
  toggleGoalCompletion,
  deleteGoal,
  clearCompletedGoals,
  type GoalItemData,
} from '@/app/actions/goal-actions';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  xp: number;
}

export function useTodos(userId: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dailyGained, setDailyGained] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Ref holds latest values for async callbacks
  const todosRef = useRef<Todo[]>([]);

  // Update ref in useEffect to avoid accessing during render
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  // ── Load goals from server + XP from /api/xp on mount ────────────────────────
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const [goals, xpRes] = await Promise.all([
          getUserGoals(),
          fetch('/api/xp').then((r) => r.json()),
        ]);

        if (cancelled) return;

        if ('error' in goals) throw new Error(String(goals.error));

        const todoList: Todo[] = goals.map((g: GoalItemData) => ({
          id: g.id,
          text: g.title,
          done: g.isCompleted,
          xp: g.xpWeight,
        }));
        setTodos(todoList);

        setDailyGained(xpRes.gained ?? 0);
        setDailyGoal(xpRes.goal ?? 100);
        setTotalXp(xpRes.total ?? 0);
      } catch (err) {
        console.error('[useTodos] Failed to load goals:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addTodo = useCallback(
    async (text: string, xp: number) => {
      if (!userId) return;

      // Optimistic insert
      const tempId = `temp_${Math.random().toString(36).slice(2)}`;
      const optimistic: Todo = { id: tempId, text, done: false, xp };
      setTodos((prev) => [optimistic, ...prev]);

      try {
        const created = await createGoal({ title: text, xpWeight: xp });
        if ('error' in created) throw new Error(String(created.error));
        
        // Replace temp with real
        setTodos((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t))
        );
      } catch (err) {
        console.error('[useTodos] Failed to create goal:', err);
        // Rollback optimistic insert
        setTodos((prev) => prev.filter((t) => t.id !== tempId));
      }
    },
    [userId]
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      if (!userId) return;

      // Ignore temp IDs
      if (id.startsWith('temp_')) return;

      // Optimistic toggle
      const current = todosRef.current.find((t) => t.id === id);
      if (!current) return;

      const nextDone = !current.done;
      const xpDelta = nextDone ? current.xp : -current.xp;

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t))
      );
      setDailyGained((g) => Math.max(0, g + xpDelta));
      setTotalXp((t) => Math.max(0, t + xpDelta));

      try {
        await toggleGoalCompletion(id);
      } catch (err) {
        console.error('[useTodos] Failed to toggle goal:', err);
        // Rollback
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t))
        );
        setDailyGained((g) => Math.max(0, g - xpDelta));
        setTotalXp((t) => Math.max(0, t - xpDelta));
      }
    },
    [userId]
  );

  const clearDone = useCallback(async () => {
    if (!userId) return;

    // Optimistic
    const doneIds = todosRef.current.filter((t) => t.done).map((t) => t.id);
    if (doneIds.length === 0) return;
    setTodos((prev) => prev.filter((t) => !t.done));

    try {
      await clearCompletedGoals();
    } catch (err) {
      console.error('[useTodos] Failed to clear done goals:', err);
      // Reload on failure
      const goals = await getUserGoals();
      if (!('error' in goals)) {
        setTodos(
          goals.map((g) => ({
            id: g.id,
            text: g.title,
            done: g.isCompleted,
            xp: g.xpWeight,
          }))
        );
      }
    }
  }, [userId]);

  const deleteTodo = useCallback(
    async (id: string) => {
      if (!userId) return;

      if (id.startsWith('temp_')) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        return;
      }

      // Optimistic delete (XP reversal on completed goals handled server-side)
      setTodos((prev) => prev.filter((t) => t.id !== id));

      try {
        await deleteGoal(id);
        // Refresh XP from server to get the corrected value
        fetch('/api/xp')
          .then((r) => r.json())
          .then((data) => {
            setDailyGained(data.gained ?? 0);
            setTotalXp(data.total ?? 0);
          })
          .catch(() => {});
      } catch (err) {
        console.error('[useTodos] Failed to delete goal:', err);
        // Reload on failure
        const goals = await getUserGoals();
        if (!('error' in goals)) {
          setTodos(
            goals.map((g) => ({
              id: g.id,
              text: g.title,
              done: g.isCompleted,
              xp: g.xpWeight,
            }))
          );
        }
      }
    },
    [userId]
  );

  // ── Derived values ───────────────────────────────────────────────────────────
  const xpPercentage = Math.min(
    100,
    Math.max(0, (dailyGained / Math.max(dailyGoal, 1)) * 100)
  );
  const activeTodos = useMemo(() => todos.filter((t) => !t.done), [todos]);
  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);
  const completionRate = useMemo(
    () =>
      todos.length > 0
        ? Math.round((completedTodos.length / todos.length) * 100)
        : 0,
    [todos.length, completedTodos.length]
  );

  return {
    todos,
    activeTodos,
    completedTodos,
    completionRate,
    dailyGained,
    dailyGoal,
    totalXp,
    xpPercentage,
    loading,
    addTodo,
    toggleTodo,
    clearDone,
    deleteTodo,
  };
}