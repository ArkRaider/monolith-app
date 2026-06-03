'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

export function ClockWidget({ minimized }: { minimized?: boolean }) {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeString = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  if (minimized) {
    return (
      <div className="flex items-center gap-2 px-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-mono font-bold text-foreground">{timeString}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-w-[150px] w-full h-full" style={{ containerType: 'inline-size' }}>
      <Clock className="text-primary mb-2" style={{ width: '12cqw', height: '12cqw' }} />
      <div className="font-bold font-mono text-foreground tracking-widest" style={{ fontSize: '22cqw' }}>
        {timeString}
      </div>
    </div>
  );
}
