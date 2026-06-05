'use client';

import { Home, Users, Flame, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStreak } from '@/app/actions/gamification-actions';
import { motion, useTime, useTransform } from 'framer-motion';

function Continuous3DFire({ streak }: { streak: number }) {
  const time = useTime();
  
  // Combine different sine waves with prime-ish periods to prevent obvious repeating patterns
  const rotateX = useTransform(time, (t) => Math.sin(t / 1300) * 15 + Math.cos(t / 800) * 10);
  const rotateY = useTransform(time, (t) => Math.cos(t / 1700) * 25 + Math.sin(t / 1100) * 15);
  const scale = useTransform(time, (t) => 1 + Math.sin(t / 600) * 0.05 + Math.cos(t / 900) * 0.05);
  
  // Dynamic color and glow
  const dropShadow = useTransform(time, (t) => {
    if (streak === 0) return 'drop-shadow(0 0 4px rgba(255,255,255,0.2))';
    const intensity = Math.abs(Math.sin(t / 700)) * 0.3 + 0.7; // 0.7 to 1.0
    return `drop-shadow(0 0 ${8 * intensity}px rgba(255,100,0,${0.6 * intensity})) drop-shadow(0 0 ${16 * intensity}px rgba(255,120,0,${0.8 * intensity}))`;
  });

  return (
    <div style={{ perspective: '800px' }} className="w-8 h-8 flex items-center justify-center relative pointer-events-none">
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale,
          filter: dropShadow,
          transformStyle: "preserve-3d"
        }}
        className={`relative flex items-center justify-center ${streak > 0 ? "text-orange-500" : "text-white/30"}`}
      >
        {/* Back layer (larger, darker orange) */}
        {streak > 0 && (
          <motion.div 
            animate={{ z: -8 }}
            className="absolute text-orange-700/80 blur-[2px]"
          >
            <Flame size={24} fill="currentColor" strokeWidth={0} />
          </motion.div>
        )}
        
        {/* Middle layer (main) */}
        <motion.div animate={{ z: 0 }}>
          <Flame 
            size={20} 
            fill={streak > 0 ? "currentColor" : "none"} 
            strokeWidth={streak > 0 ? 1 : 2}
          />
        </motion.div>

        {/* Front layer (smaller, bright yellow) */}
        {streak > 0 && (
          <motion.div 
            animate={{ z: 8 }}
            className="absolute text-yellow-300"
          >
            <Flame size={12} fill="currentColor" strokeWidth={0} className="mt-2" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

interface MinimalSidebarProps {
  isDark: boolean;
  setTheme: (theme: string) => void;
  isPeoplePanelOpen: boolean;
  setIsPeoplePanelOpen: Dispatch<SetStateAction<boolean>>;
  localState: 'grid' | 'minimized' | 'hidden';
  setLocalState: Dispatch<SetStateAction<'grid' | 'minimized' | 'hidden'>>;
}

export function MinimalSidebar({
  isDark,
  setTheme,
  isPeoplePanelOpen,
  setIsPeoplePanelOpen,
  localState,
  setLocalState
}: MinimalSidebarProps) {
  const { user } = useUser();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      getUserStreak(user.id).then(setStreak).catch(console.error);
    }
  }, [user]);

  return (
    <aside className={`fixed left-4 top-6 bottom-6 w-14 z-50 flex flex-col items-center py-6 rounded-full border backdrop-blur-2xl transition-all duration-700 ${isDark ? 'bg-[#1e1e20]/60 border-white/10 shadow-2xl' : 'bg-white/60 border-black/10 shadow-xl'}`}>
      <div className="flex-1 flex flex-col items-center gap-6">
        <button className={`p-2 transition-all duration-300 opacity-60 hover:opacity-100 ${isDark ? 'text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-black hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'}`}>
          <Home size={20} />
        </button>
        <button 
          onClick={() => setIsPeoplePanelOpen(!isPeoplePanelOpen)}
          className={`p-2 transition-all duration-300 ${isPeoplePanelOpen ? (isDark ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]') : (isDark ? 'opacity-60 hover:opacity-100 text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-60 hover:opacity-100 text-black hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]')}`}
          title="Toggle People Panel"
        >
          <Users size={20} />
        </button>
        {localState !== 'grid' && (
          <button 
            onClick={() => setLocalState(localState === 'hidden' ? 'minimized' : 'hidden')}
            className={`p-2 transition-all duration-300 opacity-60 hover:opacity-100 ${isDark ? 'text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-black hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'}`}
            title={localState === 'hidden' ? "Show my video" : "Hide my video"}
          >
            {localState === 'hidden' ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className={`flex flex-col items-center gap-1 font-bold text-xs ${isDark ? 'text-white/60 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]' : 'text-black/60 drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]'}`}>
          <Continuous3DFire streak={streak} />
          {streak}
        </div>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-2 transition-all duration-300 opacity-60 hover:opacity-100 ${isDark ? 'text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-black hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'}`}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </aside>
  );
}
