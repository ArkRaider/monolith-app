'use client';

import { Home, Users, Flame, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

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
  return (
    <aside className={`fixed left-6 top-6 bottom-6 w-16 z-50 flex flex-col items-center py-6 rounded-[32px] border backdrop-blur-2xl transition-all duration-700 ${isDark ? 'bg-neutral-950/70 border-white/10 shadow-2xl' : 'bg-white/70 border-black/10 shadow-xl'}`}>
      <div className="flex-1 flex flex-col items-center gap-6">
        <button className={`p-3 rounded-2xl transition-colors opacity-70 hover:opacity-100 ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}>
          <Home size={20} />
        </button>
        <button 
          onClick={() => setIsPeoplePanelOpen(!isPeoplePanelOpen)}
          className={`p-3 rounded-2xl transition-colors ${isPeoplePanelOpen ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : (isDark ? 'opacity-50 hover:opacity-100 hover:bg-white/10 text-white' : 'opacity-50 hover:opacity-100 hover:bg-black/10 text-black')}`}
          title="Toggle People Panel"
        >
          <Users size={22} />
        </button>
        {localState === 'hidden' && (
          <button 
            onClick={() => setLocalState('minimized')}
            className={`p-3 rounded-2xl transition-colors opacity-50 hover:opacity-100 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
            title="Show my video"
          >
            <Eye size={22} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className={`flex flex-col items-center gap-1 font-bold text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          <Flame size={24} />
          0
        </div>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-3 rounded-2xl transition-colors opacity-50 hover:opacity-100 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </aside>
  );
}
