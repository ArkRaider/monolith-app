'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useState, useMemo } from 'react';
import { CheckCircle, Circle, Trophy, Calendar } from 'lucide-react';
import { getUserStudyGrid, getUserStreak } from '@/app/actions/gamification-actions';
import { GlobalPomodoro } from '@/components/GlobalPomodoro';
import { useTodos } from '@/hooks/useTodos';
import { NavProfileBadge } from '@/components/navigation/NavProfileBadge';
import { NavLinks } from '@/components/navigation/NavLinks';
import { useTheme } from 'next-themes';
import { useLayout } from '@/components/theme-provider';

// ── Opacity scaling — no divide-by-zero ──────────────────────────────────────
function xpToOpacity(xp: number, goal: number): number {
  const safeGoal = Math.max(goal, 1);
  const ratio    = Math.min(Math.max(xp, 0) / safeGoal, 1);
  return 0.18 + ratio * 0.82; // [0.18 … 1.0]
}

// ── Month-anchored activity grid ──────────────────────────────────────────────
// Returns one cell per day of the CURRENT month (day 1 → index 0).
// Future days beyond today return { ratio: 0, isFuture: true }.
// This ensures day 18 always maps to the 18th cell — no backwards offset tricks.
function buildMonthGrid(
  data: { date: string; xpGained: number; xpGoal: number }[]
): { date: string; dayNum: number; xp: number; ratio: number; isToday: boolean; isFuture: boolean }[] {
  const now      = new Date();
  const year     = now.getFullYear();
  const month    = now.getMonth();
  const todayNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activityMap = new Map(
    data.map(d => [d.date, { xp: d.xpGained ?? 0, goal: Math.max(d.xpGoal ?? 100, 1) }])
  );

  return Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum  = i + 1; // 1-based
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    const entry   = activityMap.get(dateStr);
    const isFuture = dayNum > todayNum;
    const isToday  = dayNum === todayNum;
    const rawXp   = (!isFuture && entry) ? (entry.xp ?? 0) : 0;
    const ratio   = (!isFuture && entry) ? xpToOpacity(entry.xp, entry.goal) : 0;
    return { date: dateStr, dayNum, xp: rawXp, ratio, isToday, isFuture };
  });
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const { theme, setTheme } = useTheme();
  const { layout, setLayout } = useLayout();

  const [activityData, setActivityData] = useState<{ date: string; xpGained: number; xpGoal: number; minutesStudied: number }[]>([]);
  const [streak, setStreak] = useState(0);

  // Single source of truth for todos + XP
  const {
    todos,
    activeTodos,
    completionRate,
    toggleTodo,
  } = useTodos(isLoaded && user ? user.id : null);

  useEffect(() => {
    if (isLoaded && user) {
      getUserStudyGrid(user.id).then(data => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setActivityData(data.filter((d) => d.date >= thirtyDaysAgo));
      });
      getUserStreak(user.id).then(setStreak);
    }
  }, [isLoaded, user]);

  const monthGrid      = buildMonthGrid(activityData);
  const activeDaysCount = activityData.filter(d => d.xpGained > 0 || d.minutesStudied > 0).length;

  // ── Sidebar activity toggle ─────────────────────────────────────────────────
  const [isWeekView, setIsWeekView] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const monthLabel = hasMounted ? MONTHS[new Date().getMonth()] : '...';
  const dayNum     = hasMounted ? new Date().getDate() : '--';
  const totalDays  = hasMounted ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : '--';

  // 7-cell week strip: Mon–Sun of the current week
  const weekGrid = useMemo(() => {
    if (!hasMounted) return Array.from({ length: 7 }, (_, i) => ({ label: 'M', ratio: 0, isToday: false }));
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const DAY_LABELS = ['M','T','W','T','F','S','S'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const entry = activityData.find((a) => a.date === key);
      const xp   = entry?.xpGained ?? 0;
      const goal = Math.max(entry?.xpGoal ?? 100, 1);
      return {
        label:   DAY_LABELS[i],
        ratio:   Math.min(xp / goal, 1),
        isToday: d.toDateString() === today.toDateString(),
      };
    });
  }, [hasMounted, activityData]);

  return (
    <>
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border p-6 flex-shrink-0 bg-background z-10 relative h-screen overflow-y-auto">
        <NavProfileBadge />

        <div className="mb-8">
          <div className="font-[family-name:var(--font-primary)] text-sm tracking-widest text-primary flex items-center gap-2 font-black">
            <span className="glow-fire text-lg">🔥</span> {streak} DAY STREAK
          </div>
        </div>

        <NavLinks />

        {/* Divider */}
        <div className="h-px bg-border mb-6 w-full" />


        {/* 30-Day / Weekly Activity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsWeekView(v => !v)}
              className="font-[family-name:var(--font-primary)] text-[9px] uppercase font-bold tracking-widest text-secondary flex items-center gap-1.5 hover:text-foreground transition-colors outline-none"
            >
              <Calendar size={10} />
              ACTIVITY
              <span className="text-[8px] border border-border px-0.5 opacity-60">
                {isWeekView ? 'WEEK' : 'MONTH'}
              </span>
            </button>
            <span className="font-[family-name:var(--font-primary)] text-[9px] font-black" style={{ color: 'var(--color-primary)' }}>
              {monthLabel} {"//"} {String(dayNum).padStart(2,'0')}/{String(totalDays).padStart(2,'0')}
            </span>
          </div>

          {isWeekView ? (
            /* ── Week strip: 7 square cells Mon–Sun ── */
            <div className="flex gap-1">
              {weekGrid.map((cell, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className="w-full h-5 border transition-colors"
                    style={{
                      background:  'var(--color-primary)',
                      opacity:     cell.isToday ? 1 : (0.15 + cell.ratio * 0.85),
                      borderColor: cell.isToday ? 'var(--color-foreground)' : 'color-mix(in srgb, var(--color-border) 40%, transparent)',
                      boxShadow:   cell.isToday ? 'inset 0 0 0 1px var(--color-foreground)' : 'none',
                    }}
                    title={cell.label}
                  />
                  <span className="font-[family-name:var(--font-primary)] text-[7px] text-secondary">{cell.label}</span>
                </div>
              ))}
            </div>
          ) : (
            /* ── Data-Stream Heatmap: dense 10×10 cells, full month ── */
            <div className="flex flex-wrap gap-[2px]">
              {monthGrid.map((cell) => {
                // Opacity tiers: future → 0.08 ghost, past/no-data → 0.08, active → high contrast, today → 1.0
                const cellOpacity = cell.isFuture
                  ? 0.08
                  : cell.isToday
                    ? 1
                    : cell.ratio > 0
                      ? 0.4 + cell.ratio * 0.6 // Boost contrast for active days
                      : 0.08; // Lower inactive days opacity

                const tooltipText = cell.isFuture
                  ? cell.date
                  : `${cell.date} · ${cell.xp} XP`;

                return (
                  <div
                    key={cell.date}
                    title={tooltipText}
                    style={{
                      width:      '10px',
                      height:     '10px',
                      flexShrink: 0,
                      background: cell.isFuture
                        ? 'var(--color-border)'
                        : 'var(--color-primary)',
                      opacity:    cellOpacity,
                      transition: 'opacity 0.2s',
                      // Today: sharp primary glow ring, no border on others
                      boxShadow: cell.isToday
                        ? '0 0 0 1px var(--color-background), 0 0 0 2px var(--color-primary)'
                        : 'none',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Objectives — synced with localStorage todos */}
        <div className="mb-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="font-[family-name:var(--font-primary)] text-[9px] uppercase font-bold tracking-widest text-secondary flex items-center gap-1.5">
              <Trophy size={10} />
              OBJECTIVES
            </div>
            <span className="font-[family-name:var(--font-primary)] text-[9px] text-primary">{completionRate}%</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {activeTodos.length === 0 && (
              <div className="text-[9px] text-secondary/50 font-[family-name:var(--font-primary)] uppercase">
                No active tasks. Add some in a room!
              </div>
            )}
            {activeTodos.map(todo => (
              <button
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="w-full flex items-start gap-2 py-1.5 text-left group hover:bg-surface-high transition-colors px-1"
              >
                <Circle size={10} className="text-secondary group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-[family-name:var(--font-primary)] text-[8px] uppercase font-bold text-foreground leading-snug block break-words whitespace-normal">
                    {todo.text}
                  </span>
                  <span className="font-[family-name:var(--font-primary)] text-[8px] text-primary">+{todo.xp} XP</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 w-full">
          <GlobalPomodoro />
        </div>

        <Link
          href="/dashboard/create"
          className="w-full flex items-center justify-center p-3 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-transform duration-120 active:scale-[0.98]"
        >
          + Create Room
        </Link>
      </aside>
    </>
  );
}
