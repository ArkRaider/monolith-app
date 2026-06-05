import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, Calendar as CalendarIcon, Clock, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'task' | 'reminder' | 'note' | 'occasion';
  content: string;
  time?: string;
  completed?: boolean;
}

interface WeeklyProgressPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayIndex: number; // 0-6 for Mon-Sun
  dailyHours: number[]; // Array of 7 numbers
}

export default function WeeklyProgressPanel({ isOpen, onClose, initialDayIndex, dailyHours }: WeeklyProgressPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialDayIndex);
  const [eventsData, setEventsData] = useState<Record<string, CalendarEvent[]>>({});

  // Calculate the date key (YYYY-M-D) for the selected day in the current week
  // Assuming current week is Monday-Sunday based on today
  const getDateKeyForIndex = (index: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
    const targetDate = new Date(now);
    // index is 0-6 (Mon-Sun), dayOfWeek is 1-7.
    targetDate.setDate(now.getDate() - dayOfWeek + 1 + index);
    
    // Match InteractiveCalendarWidget.tsx format: YYYY-M-D (where month is 0-indexed)
    return `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedDayIndex(initialDayIndex);
      const saved = localStorage.getItem('monolith_calendar_events');
      if (saved) {
        try {
          setEventsData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [isOpen, initialDayIndex]);

  const targetDateKey = getDateKeyForIndex(selectedDayIndex);
  const selectedEvents = eventsData[targetDateKey] || [];
  
  // Sort events so that completed ones go to the bottom
  const sortedEvents = [...selectedEvents].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full max-w-xl h-[60vh] min-h-[400px] flex flex-col p-8 sm:p-12 rounded-[2.5rem] border shadow-2xl ${
              isDark ? 'bg-neutral-900/80 backdrop-blur-3xl border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)]' : 'bg-white/80 backdrop-blur-3xl border-black/10 shadow-[0_0_80px_rgba(0,0,0,0.1)]'
            }`}
          >
            {/* Header: Tabs and Close button */}
            <div className="flex items-start justify-between border-b border-neutral-500/10 pb-6 mb-6">
              <div className="flex gap-4 sm:gap-6">
                {days.map((day, idx) => {
                  const isActive = idx === selectedDayIndex;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`font-mono text-sm tracking-widest uppercase transition-opacity ${
                        isActive ? 'opacity-100 font-bold' : 'opacity-30 hover:opacity-70'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={onClose}
                className={`opacity-50 hover:opacity-100 transition-opacity p-2 -mr-2`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-end gap-3 mb-10">
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-mono tracking-widest uppercase ${isDark ? 'opacity-40' : 'opacity-60'}`}>Time In Flow</span>
                  <span className="font-mono text-4xl tracking-tighter leading-none">
                    {dailyHours[selectedDayIndex]?.toFixed(2) || '0.00'}
                    <span className={`text-sm ml-1 ${isDark ? 'opacity-50' : 'opacity-70 font-semibold'}`}>hrs</span>
                  </span>
                </div>
              </div>

              {/* Read-Only Events List */}
              <div className="flex flex-col flex-1 overflow-y-auto pr-2 scrollbar-thin">
                <span className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${isDark ? 'opacity-40' : 'opacity-60'}`}>Logged Directives</span>
                
                {sortedEvents.length === 0 ? (
                   <div className="py-6 opacity-30 font-mono text-[10px] tracking-widest uppercase text-center border-t border-neutral-500/10 pt-8 mt-2">
                     No directives for this cycle.
                   </div>
                ) : (
                  sortedEvents.map((ev, index, array) => (
                    <div key={ev.id} className="flex flex-col">
                      <div className="flex items-start justify-between group gap-4 py-3 px-2 -mx-2 transition-all">
                        <div className={`flex items-start gap-3 overflow-hidden mt-0.5 transition-opacity ${ev.completed ? 'opacity-40' : 'opacity-70 group-hover:opacity-100'}`}>
                          {ev.type === 'task' ? (
                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${ev.completed ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : (isDark ? 'border-white/30' : 'border-black/30')}`}>
                              {ev.completed && <Check className={`w-3 h-3 ${isDark ? 'text-black' : 'text-white'}`} strokeWidth={4} />}
                            </div>
                          ) : ev.type === 'reminder' ? (
                            <Bell className={`mt-0.5 shrink-0 w-4 h-4`} />
                          ) : ev.type === 'note' ? (
                            <FileText className={`mt-0.5 shrink-0 w-4 h-4`} />
                          ) : (
                            <CalendarIcon className={`mt-0.5 shrink-0 w-4 h-4`} />
                          )}
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm ${ev.completed ? 'line-through' : ''}`}>{ev.content}</span>
                            {ev.time && <span className={`text-[10px] font-mono flex items-center gap-1.5`}><Clock className="w-3 h-3"/> {ev.time}</span>}
                          </div>
                        </div>
                      </div>
                      {index < array.length - 1 && (
                        <div className={`mx-3 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
