'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Clock, Plus, Volume2, VolumeX, Video, MicOff, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import NavigationDock from '@/components/minimal/NavigationDock'; 
import CreateRoomModal from '@/components/minimal/CreateRoomModal';
import CustomCursor from '@/components/minimal/CustomCursor';
import AudioGenerator from '@/components/minimal/AudioGenerator';
import InteractiveCanvas from '@/components/minimal/InteractiveCanvas';
import DroneVisualizer from '@/components/minimal/DroneVisualizer';
import NotificationsWidget from '@/components/minimal/NotificationsWidget';
import ProfileWidget from '@/components/minimal/ProfileWidget';

interface Room {
  id: string;
  slug: string;
  name: string;
  subject: string;
  capacity: number;
  vibe: string | null;
  visibility: string;
  creatorName: string;
  creatorId: string;
  participantCount: number;
  isCurated: boolean;
  isSaved?: boolean;
  allowCam: boolean;
  allowMic: boolean;
}

export default function MinimalDashboardClient({ initialRooms, clerkId }: { initialRooms: Room[], clerkId: string }) {
  const router = useRouter();
  
  // Data State
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [liveHeadcounts, setLiveHeadcounts] = useState<Record<string, number>>({});
  
  const roomsSectionRef = React.useRef<HTMLDivElement>(null);
  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // UI State
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState<number>(36.4);
  const [dailyHours, setDailyHours] = useState<number[]>([3, 5, 2.5, 8, 4.5, 1.5, 6]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time activity for the graph
  const fetchWeeklyActivity = useCallback(async () => {
    try {
      // Lazy load action to avoid top-level import issues if any
      const { getUserStudyGrid } = await import('@/app/actions/gamification-actions');
      const grid = await getUserStudyGrid(clerkId);
      
      const now = new Date();
      const day = now.getDay() || 7; // 1-7 (Mon-Sun)
      const currentWeekData = [0, 0, 0, 0, 0, 0, 0];
      let totalWeeklyHours = 0;
      
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - day + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const activity = grid.find((a: any) => a.date === dateStr);
        if (activity) {
          const hours = activity.minutesStudied / 60;
          currentWeekData[i - 1] = hours;
          totalWeeklyHours += hours;
        }
      }
      setDailyHours(currentWeekData);
      setWeeklyHours(Number(totalWeeklyHours.toFixed(2)));
    } catch (e) {
      console.error('Failed to fetch activity grid:', e);
    }
  }, [clerkId]);

  useEffect(() => {
    fetchWeeklyActivity();
  }, [fetchWeeklyActivity]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundType, setSoundType] = useState<'drone' | 'silence'>('silence');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Toggles & Modes
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customCursorActive, setCustomCursorActive] = useState(true);
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CURATED' | 'CAMERA ONLY'>('ALL');

  // Filtered Rooms
  const filteredRooms = rooms.filter(room => {
    if (activeFilter === 'CURATED') return room.isCurated;
    if (activeFilter === 'CAMERA ONLY') return room.allowCam && !room.allowMic;
    return true;
  });

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global headcount socket for live updates
  useEffect(() => {
    let active = true;
    const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || 'https://monolith-signaling-server.onrender.com');
    socket.on('global-headcount-update', ({ roomId, liveCount }: { roomId: string, liveCount: number }) => {
      if (!active) return;
      setLiveHeadcounts(prev => ({ ...prev, [roomId]: liveCount }));
    });
    return () => {
      active = false;
      if (socket.connected) socket.disconnect();
    };
  }, []);

  // Real-time UTC clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Enter room trigger -> Routes to Pre-Join Lobby instead of immediately setting active local room
  const handleEnterRoom = (slug: string) => {
    router.push(`/room/${slug}/minimal-lobby`);
  };

  if (!mounted) return null;

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'short' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between font-sans leading-relaxed transition-colors duration-700 select-text ${
        isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-950'
      }`}
      style={{
        backgroundColor: isDark ? '#050505' : '#fafafa'
      }}
    >
      {/* Background Ambience */}
      <InteractiveCanvas theme={theme as any} />
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/minimal-assets/images/architectural_void_1780392871749.png"
          alt="Spatial Brutalist Architecture"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-[1200ms] ease-out scale-110 opacity-[0.08] filter blur-xl lg:blur-2xl mix-blend-overlay`}
        />
      </div>

      {customCursorActive && <CustomCursor theme={theme as any} />}
      <div className="hidden"><AudioGenerator theme={theme as any} soundType={soundType} /></div>

      {/* Left Vertical Bar (Appears on Scroll) */}
      <div className={`fixed left-0 top-0 h-full w-16 sm:w-20 z-50 flex flex-col items-center justify-between py-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      } ${isDark ? 'bg-neutral-950/70 border-r border-white/10 backdrop-blur-2xl shadow-2xl' : 'bg-white/70 border-r border-black/10 backdrop-blur-2xl shadow-xl'}`}>
        
        {/* Top: M Logo & Clock */}
        <div className="flex flex-col items-center gap-8">
          <span className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>M</span>
          <div className="w-6 h-[1px] bg-neutral-500/20" />
          
          {/* Minimal Clock */}
          <div className="rotate-180" style={{ writingMode: 'vertical-rl' }}>
             <span className="text-[10px] font-mono tracking-[0.3em] opacity-60 uppercase">{currentTime.split(' ')[1]}</span>
          </div>
        </div>

        {/* Bottom: Plus & Profile */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              isDark ? 'border-white/20 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.45)]' : 'border-black/20 hover:bg-black hover:text-white hover:shadow-[0_0_15px_rgba(0,0,0,0.25)]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
          </button>
          
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <UserButton 
              appearance={{
                baseTheme: isDark ? dark : undefined,
                elements: {
                  avatarBox: "w-10 h-10 border border-white/20"
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col justify-start">
        
        {/* Header OS Control Bar */}
        <div className={`relative w-full transition-all duration-700 ${
          isScrolled 
            ? 'opacity-0 -translate-y-8 pointer-events-none'
            : 'opacity-100 translate-y-0 py-8'
        }`}>
          <div className="w-full max-w-7xl mx-auto pr-6 md:pr-12 pl-24 sm:pl-32 md:pl-36">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-neutral-500/10 pb-6">
              <div className="flex flex-col select-none justify-center">
                <h1 className="font-black tracking-tighter leading-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                  MONOLITH
                </h1>
                <div className="mt-2">
                  <p className="text-[9px] sm:text-[10px] tracking-[0.3em] font-medium opacity-50 uppercase whitespace-nowrap">
                    Authenticated • Minimal Environment
                  </p>
                </div>
              </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 z-50 pointer-events-auto">
            <div className="flex items-center gap-3 py-2 px-4 rounded-full border border-neutral-500/10 bg-black/5 dark:bg-black/30 backdrop-blur-2xl w-full sm:w-auto justify-center">
              <Clock className="w-4 h-4 opacity-50" />
              <span className="text-xs font-mono tracking-widest opacity-80 select-all">
                {currentTime}
              </span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              {/* INJECTED GLOBAL COMPONENTS */}
              <div className="flex items-center gap-3 mr-2 opacity-80 hover:opacity-100 transition-opacity">
                 <UserButton 
                   appearance={{
                     baseTheme: isDark ? dark : undefined,
                   }}
                 />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundType(soundType === 'drone' ? 'silence' : 'drone')}
                  className={`px-4 py-2 text-[10px] font-mono tracking-widest rounded-full uppercase border transition-all cursor-pointer flex items-center gap-2 ${
                    soundType === 'drone'
                      ? 'bg-neutral-900 border-white/20 text-white dark:bg-white dark:text-black dark:border-white shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                      : 'bg-transparent border-neutral-500/20 text-neutral-400 hover:text-white'
                  }`}
                >
                  <DroneVisualizer isActive={soundType === 'drone'} isDark={isDark && soundType === 'drone'} />
                  <span className="hidden sm:inline">{soundType === 'drone' ? 'DRONE: ACTIVE' : 'DRONE: CLAMPED'}</span>
                </button>

              </div>
            </div>
          </div>
            </header>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full max-w-[85rem] mx-auto pr-6 md:pr-12 pl-24 sm:pl-32 md:pl-36 flex-1 flex flex-col lg:flex-row gap-8 items-stretch z-10 pointer-events-auto mt-4 md:mt-16">
          <div className="flex-1 flex flex-col justify-between space-y-16 lg:space-y-24">
            
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-20 w-full">
              {/* Hero Section (61.8% Golden Ratio) */}
              <section className="space-y-6 flex-[1.618] select-none shrink-0">
                <span className="text-[10px] font-mono tracking-[0.4em] text-neutral-400 uppercase">MANDATORY COPRESENCE RING</span>
                <h2 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black tracking-tighter uppercase leading-[0.9] font-sans">
                  CONQUER ISOLATION <br /><span className="opacity-40">THROUGH SILENCE.</span>
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 tracking-wide font-mono uppercase opacity-75 max-w-2xl pt-2">
                  Camera connection mandatory. Microphone fully clamped to off. Work in absolute visual copresence.
                </p>
                <div className="pt-8">
                  <button 
                    onClick={scrollToRooms}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all duration-300 transform hover:scale-105 border ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                        : 'bg-black/5 hover:bg-black/10 border-black/20 text-black shadow-[0_0_15px_rgba(0,0,0,0.1)]'
                    }`}
                  >
                    <span>Explore Instances</span>
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              </section>

              {/* Widgets Section (38.2% Golden Ratio) */}
              <div className="hidden lg:flex gap-4 lg:gap-6 flex-1 shrink-0 w-full lg:w-auto mt-8 lg:mt-0">
                {/* Calendar Widget */}
                <div className={`flex flex-col flex-1 p-6 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] border transition-all ${isDark ? 'bg-neutral-900/40 border-white/10' : 'bg-white/40 border-black/10'}`}>
                  <div className="flex justify-between items-end mb-4 border-b border-neutral-500/20 pb-3">
                    <span className="font-mono text-sm tracking-widest uppercase">{currentMonth} {currentYear}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[8px] font-mono tracking-widest uppercase opacity-40 mb-3 text-center">
                    {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-[10px] font-mono text-center">
                    {calendarDays.map((day, i) => (
                      <div key={i} className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mx-auto transition-all ${
                        day === now.getDate() ? (isDark ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black text-white font-bold shadow-md') 
                        : day ? (isDark ? 'hover:bg-white/10 cursor-pointer opacity-70' : 'hover:bg-black/10 cursor-pointer opacity-70') : ''
                      }`}>
                        {day || ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Metric Graphic */}
                <div className={`flex flex-col flex-1 p-6 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] border transition-all ${isDark ? 'bg-neutral-900/40 border-white/10' : 'bg-white/40 border-black/10'}`}>
                  <div className="flex justify-between items-end mb-4 border-b border-neutral-500/20 pb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono tracking-widest opacity-40 uppercase">Time In Flow</span>
                      <span className="font-mono text-2xl tracking-tighter">{weeklyHours.toFixed(2)}<span className="text-xs opacity-50 ml-1">hrs</span></span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between h-full gap-2 pt-2">
                    {dailyHours.map((hours, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
                        <div className="w-full relative flex items-end justify-center h-full group">
                          <div 
                            className={`w-full max-w-[12px] rounded-full transition-all duration-300 ${isDark ? 'bg-white' : 'bg-black'} ${i === 6 ? 'opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-[pulse_1.5s_ease-in-out_infinite]' : 'opacity-20 group-hover:opacity-60'}`}
                            style={{ height: `${(hours / 12) * 100}%` }}
                          />
                        </div>
                        <span className={`text-[8px] font-mono uppercase ${i === 6 ? 'opacity-100 font-bold' : 'opacity-40'}`}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4" ref={roomsSectionRef}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
                <div className="flex gap-2">
                  {['ALL', 'CURATED', 'CAMERA ONLY'].map((filter) => (
                    <button 
                      key={filter}
                      onClick={() => setActiveFilter(filter as any)}
                      className={`px-3 py-1.5 text-[9px] font-mono tracking-widest uppercase rounded-full border transition-all ${
                        activeFilter === filter
                          ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                          : (isDark ? 'bg-transparent text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-600' : 'bg-transparent text-neutral-400 border-neutral-200 hover:text-black hover:border-neutral-400')
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                
                <div className="flex bg-neutral-500/10 rounded-full p-1 border border-neutral-500/20">
                  <button 
                    onClick={() => setViewMode('gallery')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'gallery' ? (isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') : 'text-neutral-500 opacity-50 hover:opacity-100'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? (isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') : 'text-neutral-500 opacity-50 hover:opacity-100'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {viewMode === 'gallery' ? (
                /* Minimal Room Cards mapped from dynamic DB data */
                <div className="flex gap-6 overflow-x-auto pb-8 pr-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                  {filteredRooms.map((room) => {
                    const currentCount = liveHeadcounts[room.slug] !== undefined ? liveHeadcounts[room.slug] : room.participantCount;
                    const isCameraOnly = room.allowCam && !room.allowMic;

                    return (
                      <div 
                        key={room.id} 
                        className={`group relative shrink-0 w-[80vw] sm:w-80 p-8 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] shadow-xl hover:shadow-2xl ${
                          isDark ? 'bg-neutral-900/60 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)]' : 'bg-white/60 backdrop-blur-2xl border-black/10 hover:border-black/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
                        }`} 
                        onClick={() => handleEnterRoom(room.slug)}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                        }}
                      >
                        {/* Magnetic Glare Effect */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isDark ? 'mix-blend-overlay' : 'mix-blend-multiply'}`}
                             style={{ background: `radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}, transparent 40%)` }}
                        />

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            {room.isCurated && <span className="text-[8px] font-mono tracking-widest px-2 py-0.5 rounded-full border border-sky-500/50 text-sky-400 uppercase">CURATED</span>}
                            {/* HARDWARE STATE BADGE */}
                            {isCameraOnly && (
                              <span className="text-[8px] font-mono tracking-widest flex items-center gap-1 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-full">
                                <Video className="w-2.5 h-2.5" /> ON | <MicOff className="w-2.5 h-2.5" /> OFF
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-xl tracking-tight uppercase leading-none">{room.name}</h3>
                          <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-2">{room.subject}</p>
                        </div>
                        
                        <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-4 relative z-10">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono tracking-widest opacity-40 uppercase">Occupants</span>
                            <span className="font-mono text-lg">{currentCount}/{room.capacity}</span>
                          </div>
                          <button className={`px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase rounded-full transition-transform group-hover:scale-105 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            ENTER
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRooms.length === 0 && (
                     <div className="w-full flex items-center justify-center py-12 border border-dashed border-neutral-500/20 rounded-3xl opacity-50 font-mono text-[10px] tracking-widest uppercase">
                       No instances found
                     </div>
                  )}
                </div>
              ) : (
                /* Terminal List View */
                <div className="flex flex-col gap-2 pb-8">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[9px] font-mono tracking-widest uppercase opacity-40 border-b border-neutral-500/20 mb-2">
                    <div className="col-span-5">Instance</div>
                    <div className="col-span-3">Directives</div>
                    <div className="col-span-2">Occupants</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>
                  {filteredRooms.map((room) => {
                    const currentCount = liveHeadcounts[room.slug] !== undefined ? liveHeadcounts[room.slug] : room.participantCount;
                    const isCameraOnly = room.allowCam && !room.allowMic;

                    return (
                      <div 
                        key={room.id}
                        onClick={() => handleEnterRoom(room.slug)}
                        className={`group grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                          isDark ? 'border-transparent hover:border-white/10 hover:bg-neutral-900/50' : 'border-transparent hover:border-black/10 hover:bg-white/50'
                        }`}
                      >
                        <div className="col-span-5 flex flex-col">
                           <span className="font-bold text-sm tracking-tight uppercase truncate">{room.name}</span>
                           <span className="text-[9px] font-mono uppercase tracking-widest opacity-40 truncate">{room.subject}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          {room.isCurated && <span className="w-2 h-2 rounded-full bg-sky-500" title="Curated" />}
                          {isCameraOnly ? <Video className="w-3.5 h-3.5 opacity-50" /> : <Volume2 className="w-3.5 h-3.5 opacity-50" />}
                        </div>
                        <div className="col-span-2 font-mono text-xs opacity-70">
                          {currentCount}<span className="opacity-40">/{room.capacity}</span>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button className={`opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase rounded-full ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            &gt;_ ENTER
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {filteredRooms.length === 0 && (
                     <div className="w-full flex items-center justify-center py-8 font-mono text-[10px] tracking-widest uppercase opacity-40">
                       [0] Instances matching filter criteria
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <div className="h-32" />
      </div>

      <NavigationDock 
        theme={theme as any} 
        setTheme={setTheme as any} 
        onHomeClick={() => router.push('/')}
        onBellClick={() => {}} // Handled by global NotificationBell
        onSettingsClick={() => {}}
        hasNotifications={false} // Handled by global NotificationBell
        pulseTrigger={false}
      />
      
      <NotificationsWidget />
      <ProfileWidget />

      {/* <CreateRoomModal theme={theme as any} isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={() => {}} /> */}
    </div>
  );
}
