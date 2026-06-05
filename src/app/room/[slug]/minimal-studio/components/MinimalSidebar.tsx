'use client';

import { Home, Users, Flame, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStreak } from '@/app/actions/gamification-actions';
import { motion } from 'framer-motion';

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
          <motion.div
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              rotate: [-4, 4, -2, 3, 0],
              filter: streak > 0 ? [
                'drop-shadow(0 0 4px rgba(255,100,0,0.5))',
                'drop-shadow(0 0 12px rgba(255,120,0,0.8))',
                'drop-shadow(0 0 6px rgba(255,80,0,0.6))',
                'drop-shadow(0 0 10px rgba(255,120,0,0.7))',
                'drop-shadow(0 0 4px rgba(255,100,0,0.5))',
              ] : [
                'drop-shadow(0 0 2px rgba(255,255,255,0.1))',
                'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
                'drop-shadow(0 0 2px rgba(255,255,255,0.1))',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={streak > 0 ? "text-orange-500" : ""}
          >
            <Flame 
              size={20} 
              fill={streak > 0 ? "currentColor" : "none"} 
              strokeWidth={streak > 0 ? 1.5 : 2}
            />
          </motion.div>
          {streak}
        </div>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-2 transition-all duration-300 opacity-60 hover:opacity-100 ${isDark ? 'text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-black hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'}`}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </aside>
  );
}
