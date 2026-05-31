'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCcw, Settings, X } from 'lucide-react';

export function GlobalPomodoro() {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isRunning, setIsRunning] = useState(false);
  
  // Editable settings
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  
  // Internal timer state
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isEditing, setIsEditing] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Auto-switch mode
            const nextMode = mode === 'work' ? 'break' : 'work';
            setMode(nextMode);
            const nextTime = nextMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
            // Play a ding sound here in the future
            return nextTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, workMinutes, breakMinutes]);

  // Sync initial time if settings change while not running
  useEffect(() => {
    if (!isRunning) {
      // Use setTimeout to avoid direct setState in effect
      setTimeout(() => {
        setRemainingSeconds(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
      }, 0);
    }
  }, [workMinutes, breakMinutes, mode, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    handleReset();
  };

  return (
    <div className="bg-surface border-[length:var(--border-weight)] border-border p-3 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between font-[family-name:var(--font-primary)] uppercase text-[10px] tracking-widest text-secondary font-bold">
        <span>Pomodoro</span>
        <div className="flex gap-2 items-center">
            <span className={`${mode === 'work' ? 'text-primary' : ''}`}>FOCUS</span>
            <span className="opacity-30">/</span>
            <span className={`${mode === 'break' ? 'text-primary' : ''}`}>BREAK</span>
        </div>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-xs font-[family-name:var(--font-primary)]">
                <span className="text-secondary">WORK (MIN)</span>
                <input 
                    type="number" 
                    min={1} 
                    max={120}
                    value={workMinutes} 
                    onChange={e => setWorkMinutes(Number(e.target.value))}
                    className="w-16 bg-background border border-border px-2 py-1 outline-none text-right"
                />
            </div>
            <div className="flex justify-between items-center text-xs font-[family-name:var(--font-primary)]">
                <span className="text-secondary">BREAK (MIN)</span>
                <input 
                    type="number" 
                    min={1} 
                    max={60}
                    value={breakMinutes} 
                    onChange={e => setBreakMinutes(Number(e.target.value))}
                    className="w-16 bg-background border border-border px-2 py-1 outline-none text-right"
                />
            </div>
            <button type="submit" className="w-full mt-1 bg-foreground text-background py-1.5 text-xs font-bold font-[family-name:var(--font-primary)] uppercase transition-transform active:scale-95">
                SAVE
            </button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className={`font-[family-name:var(--font-primary)] text-2xl font-black ${isRunning ? (mode === 'work' ? 'text-primary' : 'text-green-500') : 'text-foreground'}`}>
            {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:
            {(remainingSeconds % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={() => setIsRunning(!isRunning)}
                className="w-8 h-8 flex items-center justify-center bg-background hover:bg-primary hover:text-primary-foreground border-[length:var(--border-weight)] border-border transition-colors text-foreground"
            >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button 
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center bg-background hover:bg-foreground hover:text-background border-[length:var(--border-weight)] border-border transition-colors text-foreground"
            >
                <RefreshCcw size={14} />
            </button>
            <button 
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center bg-background hover:bg-foreground hover:text-background border-[length:var(--border-weight)] border-border transition-colors text-secondary"
            >
                <Settings size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
