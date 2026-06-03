'use client';

import * as React from 'react';
import { Timer } from 'lucide-react';

export function PomodoroWidget({ minimized }: { minimized?: boolean }) {
  const [timeLeft, setTimeLeft] = React.useState(25 * 60);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (minimized) {
    return (
      <div className="flex items-center gap-3 px-2">
        <Timer className="w-4 h-4 text-primary shrink-0" />
        <span className="font-mono font-bold text-foreground text-lg">{formatTime(timeLeft)}</span>
        <button 
          onClick={toggleTimer}
          className="ml-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-[200px] w-full h-full p-2" style={{ containerType: 'inline-size' }}>
      <div className="flex items-center justify-center gap-2">
        <Timer className="text-primary" style={{ width: '8cqw', height: '8cqw' }} />
        <h3 className="font-semibold text-foreground font-[family-name:var(--font-primary)] uppercase tracking-widest" style={{ fontSize: '7cqw' }}>Pomodoro</h3>
      </div>
      <div className="flex-1 flex items-center justify-center my-2">
        <div className="font-bold font-mono text-center text-foreground tracking-widest" style={{ fontSize: '20cqw' }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <button 
          onClick={toggleTimer}
          className="flex-1 bg-primary text-primary-foreground rounded-2xl font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          style={{ fontSize: '5cqw', padding: '3cqw' }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={resetTimer}
          className="flex-1 bg-white/10 text-foreground rounded-2xl font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
          style={{ fontSize: '5cqw', padding: '3cqw' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
