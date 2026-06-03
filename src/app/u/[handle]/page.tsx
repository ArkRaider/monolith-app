'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// § 1 · Date Math Helpers
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];
const DAY_LABELS = ['M','T','W','T','F','S','S'];

function getDaysInCurrentMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function getCurrentDayNumber(): number {
  return new Date().getDate();
}

function getCurrentMonthName(): string {
  return MONTH_NAMES[new Date().getMonth()] ?? 'JANUARY';
}

function getMonthStartOffset(): number {
  const d     = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0=Sun
  return (first + 6) % 7; // rotate so Monday = 0
}

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
// § 2 · Opacity helper
// ─────────────────────────────────────────────────────────────────────────────
function xpToOpacity(xp: number, goal: number = 100): number {
  const safeXp      = Math.max(0, xp || 0);
  const progressRatio = goal > 0
    ? Math.min(safeXp / goal, 1)
    : 0;
  return 0.15 + progressRatio * 0.85;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 · Map StudyGrid to Array
// ─────────────────────────────────────────────────────────────────────────────
function buildMonthXpArray(count: number, studyGrid: any[]): number[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  return Array.from({ length: count }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = studyGrid.find(g => g.date === dateStr);
    return entry ? entry.xpGained : 0;
  });
}

function buildWeekXpArray(dates: Date[], studyGrid: any[]): number[] {
  return dates.map(d => {
    const dateStr = d.toISOString().split('T')[0];
    const entry = studyGrid.find(g => g.date === dateStr);
    return entry ? entry.xpGained : 0;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 · Activity Matrix Component
// ─────────────────────────────────────────────────────────────────────────────
function ActivityMatrix({ isWeekView, studyGrid }: { isWeekView: boolean, studyGrid: any[] }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!hasMounted) {
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1', background: 'var(--color-border)', opacity: 0.25 }} />
        ))}
      </div>
    );
  }

  const todayNum  = getCurrentDayNumber();
  const totalDays = getDaysInCurrentMonth();
  const offset    = getMonthStartOffset();
  const weekDates = getCurrentWeekDates();

  const monthXp   = buildMonthXpArray(totalDays, studyGrid);
  const weekXp    = buildWeekXpArray(weekDates, studyGrid);

  if (isWeekView) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="font-[family-name:var(--font-primary)] text-[8px] text-secondary uppercase text-center">{label}</div>
          ))}
        </div>

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
                  opacity:     isToday ? 1 : xpToOpacity(xp, 100),
                  boxShadow:   isToday ? 'inset 0 0 0 2px var(--color-foreground)' : 'inset 0 0 0 1px var(--color-border)',
                  transition:  'opacity 0.2s',
                }}
              >
                {isToday && (
                  <span className="absolute bottom-0.5 right-1 font-[family-name:var(--font-primary)] text-[7px] font-black" style={{ color: 'var(--color-foreground)', lineHeight: 1 }}>●</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDates.map((date, i) => (
            <div key={i} className="font-[family-name:var(--font-primary)] text-[8px] text-center" style={{ color: 'var(--color-secondary)' }}>{date.getDate()}</div>
          ))}
        </div>

        <div className="font-[family-name:var(--font-primary)] text-[9px] text-right" style={{ color: 'var(--color-secondary)' }}>
          {weekXp.reduce((a, b) => a + b, 0)} XP THIS WEEK
        </div>
      </div>
    );
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="font-[family-name:var(--font-primary)] text-[8px] text-secondary uppercase text-center">{label}</div>
        ))}
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />;
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
                opacity:     isToday ? 1 : xpToOpacity(xp, 100),
                boxShadow:   isToday ? 'inset 0 0 0 2px var(--color-foreground)' : 'inset 0 0 0 1px var(--color-border)',
                transition:  'opacity 0.2s, box-shadow 0.15s',
              }}
            >
              {isToday && <span className="absolute bottom-0.5 right-0.5 font-[family-name:var(--font-primary)] text-[7px] font-black leading-none" style={{ color: 'var(--color-foreground)' }}>●</span>}
            </div>
          );
        })}
      </div>

      <div className="font-[family-name:var(--font-primary)] text-[9px] text-right" style={{ color: 'var(--color-secondary)' }}>
        {monthXp.slice(0, todayNum).reduce((a, b) => a + b, 0)} XP THIS MONTH
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 · Activity Section Wrapper
// ─────────────────────────────────────────────────────────────────────────────
function ActivitySection({ studyGrid }: { studyGrid: any[] }) {
  const [isWeekView, setIsWeekView] = useState(false);
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsWeekView(v => !v)}
          className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest font-bold text-secondary hover:text-foreground transition-colors flex items-center gap-2 outline-none"
          title={isWeekView ? 'Switch to month view' : 'Switch to week view'}
        >
          ACTIVITY
          <span className="text-[9px] px-1 py-0.5 opacity-60" style={{ border: '1px solid var(--color-border)' }}>
            {isWeekView ? 'WEEK' : 'MONTH'}
          </span>
        </button>

        <span className="font-[family-name:var(--font-primary)] text-xs font-black tracking-wider" style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {`${monthName} // ${String(dayNum).padStart(2, '0')}/${String(totalDays).padStart(2, '0')}`}
        </span>
      </div>

      <ActivityMatrix isWeekView={isWeekView} studyGrid={studyGrid} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 · Page Content Component
// ─────────────────────────────────────────────────────────────────────────────
import { sendFriendRequest } from '@/app/actions/friend-actions';

function ProfilePageClient({ profile, studyGrid, streak, totalHours, initialFriendshipStatus }: any) {
  const [friendshipStatus, setFriendshipStatus] = useState(initialFriendshipStatus);
  const initials = profile.displayName ? profile.displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  const handleAddFriend = async () => {
    if (friendshipStatus !== 'NONE') return;
    setFriendshipStatus('PENDING_SENT'); // optimistic
    const res = await sendFriendRequest(profile.id);
    if (res.error) setFriendshipStatus('NONE'); // revert on error
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
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-32 h-32 object-cover bg-surface border border-border shrink-0" />
          ) : (
            <div className="w-32 h-32 bg-surface border border-border flex items-center justify-center shrink-0">
              <span className="text-4xl font-[family-name:var(--font-primary)] font-semibold text-secondary">
                {initials}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h1 className="text-4xl font-[family-name:var(--font-primary)] font-semibold tracking-tight">
                {profile.displayName}
              </h1>
              <div className="font-[family-name:var(--font-primary)] text-sm text-secondary uppercase tracking-widest mt-1">
                @{profile.handle}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.programmingTools?.slice(0, 3).map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-1 border border-border font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-wider text-secondary"
                >
                  {s}
                </span>
              ))}
              <span className="px-2 py-1 border border-transparent font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-wider text-border ml-2">
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-8 py-3 bg-transparent border border-border text-foreground font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-colors duration-120 hover:border-primary active:scale-[0.98]">
              Send DM
            </button>
            {friendshipStatus === 'NONE' && (
              <button onClick={handleAddFriend} className="px-8 py-3 bg-primary border border-primary text-primary-foreground font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-colors duration-120 hover:opacity-80 active:scale-[0.98]">
                Add Friend
              </button>
            )}
            {friendshipStatus === 'PENDING_SENT' && (
              <button disabled className="px-8 py-3 bg-transparent border border-border text-secondary font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase cursor-not-allowed">
                Request Sent
              </button>
            )}
            {friendshipStatus === 'PENDING_RECEIVED' && (
              <button disabled className="px-8 py-3 bg-transparent border border-border text-secondary font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase cursor-not-allowed" title="Check your Inbox to accept">
                Check Inbox
              </button>
            )}
            {friendshipStatus === 'ACCEPTED' && (
              <button disabled className="px-8 py-3 bg-transparent border border-border text-primary font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase cursor-not-allowed">
                Friends ✓
              </button>
            )}
          </div>
        </div>

        {/* Live Status */}
        {profile.currentGrind && (
          <div className="p-4 border border-primary flex items-center justify-between"
            style={{ background: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary">
                Status
              </span>
              <span className="font-[family-name:var(--font-primary)] font-semibold text-sm">
                {profile.currentGrind}
              </span>
            </div>
          </div>
        )}

        {/* Bio & Details */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 border border-border bg-surface p-6 flex flex-col gap-4">
            <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary font-bold">About</h3>
            <p className="text-sm font-[family-name:var(--font-primary)] leading-relaxed whitespace-pre-wrap">
              {profile.bio || 'This user is a mystery...'}
            </p>
            {profile.activeGoals?.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary font-bold mb-3">Active Goals</h3>
                <ul className="flex flex-col gap-2">
                  {profile.activeGoals.map((goal: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-[family-name:var(--font-primary)]">
                      <span className="text-primary mt-1">●</span> {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
            <div className="border border-border bg-surface p-6 flex flex-col gap-4">
              <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary font-bold">Links</h3>
              <div className="flex flex-col gap-3">
                {profile.github && (
                  <a href={`https://github.com/${profile.github.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-[family-name:var(--font-primary)] text-foreground hover:text-primary transition-colors">
                    <span className="font-bold">GH</span> /{profile.github.replace('@', '')}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://x.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-[family-name:var(--font-primary)] text-foreground hover:text-primary transition-colors">
                    <span className="font-bold">X</span> /{profile.twitter.replace('@', '')}
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-[family-name:var(--font-primary)] text-foreground hover:text-primary transition-colors">
                    <span className="font-bold">IG</span> /{profile.instagram.replace('@', '')}
                  </a>
                )}
                {(!profile.github && !profile.twitter && !profile.instagram) && (
                  <span className="text-xs text-secondary italic">No links added.</span>
                )}
              </div>
            </div>
            {profile.subjects?.length > 0 && (
              <div className="border border-border bg-surface p-6 flex flex-col gap-4">
                <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary font-bold">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((sub: string) => (
                    <span key={sub} className="px-2 py-1 border border-border text-[10px] uppercase tracking-wider text-secondary">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Streak', value: `${streak}`, unit: 'days', accent: true },
            { label: 'Total XP', value: `${profile.xp}`, unit: 'xp', accent: false },
            { label: 'Total Hours',    value: `${totalHours}`,    unit: 'h',    accent: false },
            { label: 'Rooms Hosted',   value: `${profile.roomsCreated?.length || 0}`,  unit: '',     accent: false },
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
        <ActivitySection studyGrid={studyGrid} />

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 · Data Fetcher Wrapper
// ─────────────────────────────────────────────────────────────────────────────
import { getUserProfile } from '@/app/actions/user-actions';
import { getUserStudyGrid, getUserStreak } from '@/app/actions/gamification-actions';
import { getFriendshipStatus } from '@/app/actions/friend-actions';
import { notFound } from 'next/navigation';

export default function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile(resolvedParams.handle);
        if (!profile || 'error' in profile) {
          setData(null);
          setLoading(false);
          return;
        }
        
        const studyGrid = await getUserStudyGrid(profile.id);
        const streak = await getUserStreak(profile.id);
        const totalMinutes = studyGrid.reduce((sum: number, d: any) => sum + d.minutesStudied, 0);
        const totalHours = Math.floor(totalMinutes / 60);

        const friendshipStatus = await getFriendshipStatus(profile.id);

        setData({ profile, studyGrid, streak, totalHours, initialFriendshipStatus: friendshipStatus });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.handle]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-primary)] uppercase text-xs tracking-widest text-secondary animate-pulse">Loading Profile...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-[family-name:var(--font-primary)] gap-4">
        <h1 className="text-xl uppercase tracking-widest text-foreground font-bold">Profile Not Found</h1>
        <Link href="/dashboard" className="text-xs uppercase tracking-widest text-primary border border-primary px-4 py-2 hover:bg-primary/10">Return to Dashboard</Link>
      </div>
    );
  }

  return <ProfilePageClient {...data} />;
}
