'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// § 1 · Date Math Helpers (isolated, no inline math, no division-by-zero)
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];
const DAY_LABELS = ['M','T','W','T','F','S','S'];

/** Total days in the current calendar month — never undefined */
function getDaysInCurrentMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Today's local day number (1-based) */
function getCurrentDayNumber(): number {
  return new Date().getDate();
}

/** Full uppercase month name for the current month */
function getCurrentMonthName(): string {
  return MONTH_NAMES[new Date().getMonth()] ?? 'JANUARY';
}

/** ISO Monday-first offset for the 1st of the current month (0=Mon … 6=Sun) */
function getMonthStartOffset(): number {
  const d     = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0=Sun
  return (first + 6) % 7; // rotate so Monday = 0
}

/** The 7 dates (Mon–Sun) for the week containing today */
function getCurrentWeekDates(): Date[] {
  const today     = new Date();
  const dayOfWeek = today.getDay();                     // 0=Sun
  const monday    = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2 · Opacity helper (no NaN, no divide-by-zero)
// ─────────────────────────────────────────────────────────────────────────────
const DAILY_GOAL_XP = 100;

function xpToOpacity(xp: number): number {
  const safeXp      = Math.max(0, xp || 0);
  const progressRatio = DAILY_GOAL_XP > 0
    ? Math.min(safeXp / DAILY_GOAL_XP, 1)
    : 0;
  return 0.15 + progressRatio * 0.85;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 · Mock activity data (replace with real API fetch in production)
// ─────────────────────────────────────────────────────────────────────────────
function buildMockXpArray(count: number): number[] {
  // Deterministic-ish so SSR and CSR produce the same values → no hydration diff
  return Array.from({ length: count }, (_, i) =>
    Math.floor(((i * 47 + 13) % 200))
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 · Activity Matrix Component
// ─────────────────────────────────────────────────────────────────────────────
function ActivityMatrix({ isWeekView }: { isWeekView: boolean }) {
  // ── Hydration guard ─────────────────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // Using a timer avoids the setState-sync-in-effect lint error while still
    // guaranteeing a re-render after mount (safer than initialState technique).
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Skeleton shown until client hydration is complete
  if (!hasMounted) {
    return (
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1',
              background:  'var(--color-border)',
              opacity:     0.25,
            }}
          />
        ))}
      </div>
    );
  }

  // ── Computed values (only run client-side, after mount) ─────────────────────
  const todayNum  = getCurrentDayNumber();
  const totalDays = getDaysInCurrentMonth();
  const offset    = getMonthStartOffset();
  const weekDates = getCurrentWeekDates();

  const monthXp   = buildMockXpArray(totalDays);
  const weekXp    = buildMockXpArray(7);

  // ── Week View ────────────────────────────────────────────────────────────────
  if (isWeekView) {
    return (
      <div className="flex flex-col gap-3">
        {/* Day label row */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="font-[family-name:var(--font-primary)] text-[8px] text-secondary uppercase text-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Cell row */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDates.map((date, i) => {
            const xp      = weekXp[i] ?? 0;
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                title={`${DAY_LABELS[i]} ${date.getDate()} — ${xp} XP`}
                className="relative flex items-end justify-start"
                style={{
                  aspectRatio: '1',
                  background:  'var(--color-primary)',
                  opacity:     isToday ? 1 : xpToOpacity(xp),
                  boxShadow:   isToday
                    ? 'inset 0 0 0 2px var(--color-foreground)'
                    : 'inset 0 0 0 1px var(--color-border)',
                  transition:  'opacity 0.2s',
                }}
              >
                {isToday && (
                  <span
                    className="absolute bottom-0.5 right-1 font-[family-name:var(--font-primary)] text-[7px] font-black"
                    style={{ color: 'var(--color-foreground)', lineHeight: 1 }}
                  >
                    ●
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Date number row */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDates.map((date, i) => (
            <div
              key={i}
              className="font-[family-name:var(--font-primary)] text-[8px] text-center"
              style={{ color: 'var(--color-secondary)' }}
            >
              {date.getDate()}
            </div>
          ))}
        </div>

        <div
          className="font-[family-name:var(--font-primary)] text-[9px] text-right"
          style={{ color: 'var(--color-secondary)' }}
        >
          {weekXp.reduce((a, b) => a + b, 0)} XP THIS WEEK
        </div>
      </div>
    );
  }

  // ── Month View ───────────────────────────────────────────────────────────────
  // Build a flat array: `offset` empty slots, then day numbers 1…totalDays
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Day label header */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="font-[family-name:var(--font-primary)] text-[8px] text-secondary uppercase text-center"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />;
          }
          const xp      = monthXp[day - 1] ?? 0;
          const isToday = day === todayNum;
          return (
            <div
              key={`day-${day}`}
              title={`${day} — ${xp} XP`}
              className="relative"
              style={{
                aspectRatio: '1',
                background:  'var(--color-primary)',
                opacity:     isToday ? 1 : xpToOpacity(xp),
                // inset box-shadow is always visible regardless of cell opacity/color
                boxShadow:   isToday
                  ? 'inset 0 0 0 2px var(--color-foreground)'
                  : 'inset 0 0 0 1px var(--color-border)',
                transition:  'opacity 0.2s, box-shadow 0.15s',
              }}
            >
              {/* Today indicator dot */}
              {isToday && (
                <span
                  className="absolute bottom-0.5 right-0.5 font-[family-name:var(--font-primary)] text-[7px] font-black leading-none"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  ●
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="font-[family-name:var(--font-primary)] text-[9px] text-right"
        style={{ color: 'var(--color-secondary)' }}
      >
        {monthXp.slice(0, todayNum).reduce((a, b) => a + b, 0)} XP THIS MONTH
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 · Activity Section Wrapper (owns the toggle state + header label)
// ─────────────────────────────────────────────────────────────────────────────
function ActivitySection() {
  const [isWeekView, setIsWeekView] = useState(false);

  // Header values also need hydration guard to avoid server/client mismatch
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const monthName = hasMounted ? getCurrentMonthName() : '...';
  const dayNum    = hasMounted ? getCurrentDayNumber() : '--';
  const totalDays = hasMounted ? getDaysInCurrentMonth() : '--';

  return (
    <div className="border border-border bg-surface p-6 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsWeekView(v => !v)}
          className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest font-bold text-secondary hover:text-foreground transition-colors flex items-center gap-2 outline-none"
          title={isWeekView ? 'Switch to month view' : 'Switch to week view'}
        >
          ACTIVITY
          <span
            className="text-[9px] px-1 py-0.5 opacity-60"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {isWeekView ? 'WEEK' : 'MONTH'}
          </span>
        </button>

        <span
          className="font-[family-name:var(--font-primary)] text-xs font-black tracking-wider"
          style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}
        >
          {`${monthName} // ${String(dayNum).padStart(2, '0')}/${String(totalDays).padStart(2, '0')}`}
        </span>
      </div>

      <ActivityMatrix isWeekView={isWeekView} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 · Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = use(params);

  const profile = {
    handle:        resolvedParams.handle,
    name:          'Developer Guy',
    subjects:      ['Engineering', 'CS/Dev'],
    joinDate:      'Oct 2025',
    currentStreak: 14,
    longestStreak: 42,
    studyHours:    342,
    roomsCreated:  5,
    currentlyIn:   'The Library',
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-3xl mx-auto flex flex-col gap-12">

        <Link
          href="/dashboard"
          className="text-secondary font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest hover:text-foreground transition-colors w-fit"
        >
          ← Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 bg-surface border border-border flex items-center justify-center shrink-0">
            <span className="text-4xl font-[family-name:var(--font-primary)] font-semibold text-secondary">
              DG
            </span>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h1 className="text-4xl font-[family-name:var(--font-primary)] font-semibold tracking-tight">
                {profile.name}
              </h1>
              <div className="font-[family-name:var(--font-primary)] text-sm text-secondary uppercase tracking-widest mt-1">
                @{profile.handle}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.subjects.map(s => (
                <span
                  key={s}
                  className="px-2 py-1 border border-border font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-wider text-secondary"
                >
                  {s}
                </span>
              ))}
              <span className="px-2 py-1 border border-transparent font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-wider text-border ml-2">
                Joined {profile.joinDate}
              </span>
            </div>
          </div>

          <button className="px-8 py-3 bg-transparent border border-border text-foreground font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-colors duration-120 hover:border-primary active:scale-[0.98]">
            Send DM
          </button>
        </div>

        {/* Live Status */}
        {profile.currentlyIn && (
          <div className="p-4 border border-primary flex items-center justify-between"
            style={{ background: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary">
                Currently studying in
              </span>
              <span className="font-[family-name:var(--font-primary)] font-semibold text-sm">
                {profile.currentlyIn}
              </span>
            </div>
            <Link
              href="/room/the-library"
              className="font-[family-name:var(--font-primary)] text-[10px] text-primary uppercase tracking-widest hover:underline"
            >
              Join Room →
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Streak', value: `${profile.currentStreak}`, unit: 'days', accent: true },
            { label: 'Longest Streak', value: `${profile.longestStreak}`, unit: 'days', accent: false },
            { label: 'Total Hours',    value: `${profile.studyHours}`,    unit: 'h',    accent: false },
            { label: 'Rooms Hosted',   value: `${profile.roomsCreated}`,  unit: '',     accent: false },
          ].map(({ label, value, unit, accent }) => (
            <div key={label} className="p-6 border border-border bg-surface flex flex-col gap-2">
              <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary uppercase tracking-widest">
                {label}
              </span>
              <span
                className={`font-[family-name:var(--font-primary)] text-3xl font-medium ${accent ? 'text-primary' : ''}`}
              >
                {value}
                {unit && <span className="text-sm text-secondary"> {unit}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Activity Matrix */}
        <ActivitySection />

      </div>
    </div>
  );
}
