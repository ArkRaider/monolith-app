'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plus, Bell, Calendar as CalendarIcon, Clock, X, FileText, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CalendarEvent {
  id: string;
  type: 'task' | 'reminder' | 'occasion' | 'note';
  content: string;
  time?: string;
  completed?: boolean;
}

export default function InteractiveCalendarWidget() {
  const { theme } = useTheme();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Storage state
  const [eventsData, setEventsData] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  // UI state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'menu' | 'overview' | 'tasks' | 'reminders' | 'occasions' | 'notes'>('menu');
  const [inputValue, setInputValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM'|'PM'>('AM');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('monolith_calendar_events');
    if (saved) {
      try {
        setEventsData(JSON.parse(saved));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('monolith_calendar_events', JSON.stringify(eventsData));
    }
  }, [eventsData, isLoaded]);

  // Notifications logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${currentHours}:${currentMinutes}`;
      
      const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const todaysEvents = eventsData[dateKey] || [];
      
      todaysEvents.forEach(ev => {
        if (ev.type === 'reminder' && ev.time === timeString && !ev.completed) {
          // Trigger toast/notification
          if (window.Notification && Notification.permission === "granted") {
            new Notification("Reminder: " + ev.content);
          } else if (window.Notification && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("Reminder: " + ev.content);
              }
            });
          }
          
          // Fallback simple alert or custom UI event
          window.dispatchEvent(new CustomEvent('monolith-toast', { 
            detail: { message: `Reminder: ${ev.content}`, type: 'info' } 
          }));
          
          setEventsData(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].map(e => e.id === ev.id ? { ...e, completed: true } : e)
          }));
        }
      });
    }, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [eventsData]);

  // Request Notification permission on mount
  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Calendar logic
  const now = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'short' });
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const isToday = (day: number) => {
    return day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
  };

  const isPastDay = (day: number) => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return selectedDateObj < todayObj;
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const events = getEventsForDay(day);
    if (isPastDay(day)) {
      setPanelMode(events.length > 0 ? 'overview' : 'notes');
    } else {
      setPanelMode(events.length > 0 ? 'overview' : 'menu');
    }
    setPanelOpen(true);
    setInputValue('');
    setTimeValue('');
  };

  const handleMonthChange = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const getSelectedDateKey = () => {
    if (!selectedDay) return '';
    return `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
  };

  const getEventsForDay = (day: number) => {
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return eventsData[key] || [];
  };

  const handleAddEvent = () => {
    if (!inputValue.trim() || !selectedDay) return;
    
    const key = getSelectedDateKey();
    const eventType = (panelMode === 'notes' ? 'note' : panelMode.slice(0, -1)) as any;
    
    let timeString;
    if (panelMode === 'reminders') {
      let finalHour = selectedHour;
      if (selectedAmPm === 'PM' && finalHour < 12) finalHour += 12;
      if (selectedAmPm === 'AM' && finalHour === 12) finalHour = 0;
      timeString = `${String(finalHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    }

    const newEvent: CalendarEvent = {
      id: Math.random().toString(36).substring(7),
      type: eventType,
      content: inputValue,
      time: panelMode === 'reminders' ? timeString : undefined,
      completed: false
    };

    setEventsData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newEvent]
    }));
    
    setInputValue('');
    setTimeValue('');
  };

  const toggleTaskCompletion = (id: string) => {
    const key = getSelectedDateKey();
    setEventsData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(ev => ev.id === id ? { ...ev, completed: !ev.completed } : ev)
    }));
  };

  const deleteEvent = (id: string) => {
    const key = getSelectedDateKey();
    setEventsData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(ev => ev.id !== id)
    }));
  };

  return (
    <div className={`relative flex flex-col p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border transition-all w-full ${isDark ? 'bg-neutral-900/40 border-white/10' : 'bg-white/40 border-black/10'}`}>
      <div className="flex justify-between items-end mb-5 border-b border-neutral-500/20 pb-4">
        <span className="font-mono text-base tracking-widest uppercase">{currentMonthName} {currentYear}</span>
        <div className="flex gap-2">
          <button onClick={() => handleMonthChange(-1)} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => handleMonthChange(1)} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className={`grid grid-cols-7 gap-1 text-[9px] font-mono tracking-widest uppercase mb-4 text-center ${isDark ? 'opacity-40' : 'opacity-60 font-bold'}`}>
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-[11px] font-mono text-center">
        {calendarDays.map((day, i) => {
          const events = day ? getEventsForDay(day) : [];
          const hasEvents = events.length > 0;
          return (
            <div key={i} className="flex flex-col items-center justify-start h-10 sm:h-11">
              <div 
                onClick={() => day && handleDayClick(day)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all ${
                  day === selectedDay ? (isDark ? 'bg-white/20 border border-white/30' : 'bg-black/20 border border-black/30') :
                  day && isToday(day) ? (isDark ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black text-white font-bold shadow-md') :
                  day ? (isDark ? 'hover:bg-white/10 cursor-pointer opacity-70' : 'hover:bg-black/10 cursor-pointer opacity-70') : ''
                }`}
              >
                {day || ''}
              </div>
              {hasEvents && (
                <div className={`w-1 h-1 rounded-full mt-1 ${isDark ? 'bg-white/50' : 'bg-black/50'}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {panelOpen && selectedDay && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`absolute top-0 right-full mr-4 w-[320px] p-5 rounded-[2rem] border shadow-2xl z-50 ${isDark ? 'bg-neutral-900/95 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-white/95 backdrop-blur-2xl border-black/10 shadow-[0_0_50px_rgba(0,0,0,0.1)]'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-xs tracking-widest uppercase opacity-60">
                {selectedDay} {currentMonthName} {currentYear}
              </span>
              <div className="flex items-center gap-2">
                {panelMode === 'overview' && (
                  <button onClick={() => setPanelMode(isPastDay(selectedDay) ? 'notes' : 'menu')} className={`text-[9px] font-mono uppercase px-2 py-1 rounded-md border transition-all ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}>
                    {isPastDay(selectedDay) ? 'Add Note' : 'Adjust'}
                  </button>
                )}
                <button onClick={() => setPanelOpen(false)} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {panelMode === 'overview' && (
              <div className="flex flex-col max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {getEventsForDay(selectedDay).map((ev, index, array) => (
                    <div key={ev.id} className={`flex flex-col`}>
                      <div className={`flex items-start justify-between group gap-4 py-3 px-2 -mx-2 transition-all`}>
                        <div className={`flex items-start gap-3 overflow-hidden mt-0.5 transition-opacity ${ev.completed ? 'opacity-40' : 'opacity-60 group-hover:opacity-100'}`}>
                          {ev.type === 'task' ? (
                            <button onClick={() => toggleTaskCompletion(ev.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${ev.completed ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : (isDark ? 'border-white/50 hover:border-white' : 'border-black/50 hover:border-black')}`}>
                              {ev.completed && <Check className={`w-3 h-3 ${isDark ? 'text-black' : 'text-white'}`} strokeWidth={4} />}
                            </button>
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
                        <button onClick={() => deleteEvent(ev.id)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full ${isDark ? 'hover:bg-white/10 hover:text-red-400' : 'hover:bg-black/10 hover:text-red-600'}`}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {index < array.length - 1 && (
                        <div className={`mx-3 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      )}
                    </div>
                ))}
              </div>
            )}

            {panelMode === 'menu' && (
              <div className="flex flex-col">
                <button onClick={() => setPanelMode('tasks')} className={`flex items-center gap-3 p-3 transition-all ${isDark ? 'opacity-50 hover:opacity-100' : 'opacity-60 hover:opacity-100 text-black'}`}>
                  <Check className="w-4 h-4" /> <span className="font-mono text-[10px] tracking-widest uppercase">Tasks</span>
                </button>
                <div className={`mx-3 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <button onClick={() => setPanelMode('reminders')} className={`flex items-center gap-3 p-3 transition-all ${isDark ? 'opacity-50 hover:opacity-100' : 'opacity-60 hover:opacity-100 text-black'}`}>
                  <Bell className="w-4 h-4" /> <span className="font-mono text-[10px] tracking-widest uppercase">Reminder</span>
                </button>
                <div className={`mx-3 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <button onClick={() => setPanelMode('occasions')} className={`flex items-center gap-3 p-3 transition-all ${isDark ? 'opacity-50 hover:opacity-100' : 'opacity-60 hover:opacity-100 text-black'}`}>
                  <CalendarIcon className="w-4 h-4" /> <span className="font-mono text-[10px] tracking-widest uppercase">Occasion</span>
                </button>
              </div>
            )}

            {panelMode !== 'menu' && panelMode !== 'overview' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const events = getEventsForDay(selectedDay);
                    setPanelMode(events.length > 0 ? 'overview' : (isPastDay(selectedDay) ? 'notes' : 'menu'));
                  }} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><ChevronLeft className="w-4 h-4" /></button>
                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold">{panelMode === 'notes' ? 'Past Note' : panelMode}</span>
                </div>

                <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {getEventsForDay(selectedDay).filter(e => e.type === (panelMode === 'notes' ? 'note' : panelMode.slice(0,-1))).map(ev => (
                    <div key={ev.id} className="flex items-start justify-between group gap-3">
                      <div className="flex items-start gap-3 overflow-hidden">
                        {panelMode === 'tasks' && (
                          <button onClick={() => toggleTaskCompletion(ev.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${ev.completed ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : (isDark ? 'border-white/30 hover:border-white/60' : 'border-black/30 hover:border-black/60')}`}>
                            {ev.completed && <Check className={`w-3 h-3 ${isDark ? 'text-black' : 'text-white'}`} strokeWidth={4} />}
                          </button>
                        )}
                        {panelMode === 'notes' && (
                          <FileText className={`mt-0.5 shrink-0 w-4 h-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                        )}
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm ${ev.completed ? 'line-through opacity-40' : 'opacity-90'}`}>{ev.content}</span>
                          {ev.time && <span className={`text-[10px] font-mono flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}><Clock className="w-3 h-3"/> {ev.time}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full ${isDark ? 'hover:bg-white/10 hover:text-red-400' : 'hover:bg-black/10 hover:text-red-600'}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {getEventsForDay(selectedDay).filter(e => e.type === (panelMode === 'notes' ? 'note' : panelMode.slice(0,-1))).length === 0 && (
                    <span className="text-[9px] font-mono uppercase opacity-40 italic">No {panelMode === 'notes' ? 'notes' : panelMode}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {panelMode === 'notes' ? (
                    <textarea
                      rows={1}
                      placeholder="What did you do?"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddEvent();
                          e.currentTarget.style.height = 'auto';
                        }
                      }}
                      className={`w-full text-sm pb-2 bg-transparent border-b outline-none resize-none overflow-hidden transition-colors caret-black ${isDark ? 'border-white/10 focus:border-white/40 placeholder:text-white/30' : 'border-black/10 focus:border-black/40 placeholder:text-black/30'}`}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`New ${panelMode.slice(0,-1)}...`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                      className={`w-full text-sm pb-2 bg-transparent border-b outline-none transition-all caret-black ${isDark ? 'border-white/10 focus:border-white/40 placeholder:text-white/30' : 'border-black/10 focus:border-black/40 placeholder:text-black/30'}`}
                    />
                  )}
                  {panelMode === 'reminders' && (
                    <div className={`flex items-center justify-between p-2 bg-transparent border-b transition-all ${isDark ? 'border-white/10 focus-within:border-white/40' : 'border-black/10 focus-within:border-black/40'}`}>
                      <div className="flex items-center gap-4">
                        <Clock className="w-3 h-3 opacity-30" />
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <button onClick={() => setSelectedHour(h => h === 12 ? 1 : h + 1)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity"><ChevronUp className="w-3 h-3"/></button>
                            <span className="font-mono text-xs w-4 text-center">{selectedHour}</span>
                            <button onClick={() => setSelectedHour(h => h === 1 ? 12 : h - 1)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity"><ChevronDown className="w-3 h-3"/></button>
                          </div>
                          <span className="font-mono text-xs opacity-50 mb-0.5">:</span>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedMinute(m => (m + 10) >= 60 ? (m + 10 - 60) : m + 10)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity" title="+10 min"><ChevronsUp className="w-3 h-3"/></button>
                              <button onClick={() => setSelectedMinute(m => m === 59 ? 0 : m + 1)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity" title="+1 min"><ChevronUp className="w-3 h-3"/></button>
                            </div>
                            <span className="font-mono text-xs w-8 text-center">{String(selectedMinute).padStart(2, '0')}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedMinute(m => (m - 10) < 0 ? (m - 10 + 60) : m - 10)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity" title="-10 min"><ChevronsDown className="w-3 h-3"/></button>
                              <button onClick={() => setSelectedMinute(m => m === 0 ? 59 : m - 1)} className="p-0.5 opacity-30 hover:opacity-100 transition-opacity" title="-1 min"><ChevronDown className="w-3 h-3"/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <button 
                          onClick={() => setSelectedAmPm('AM')} 
                          className={`text-[9px] font-mono transition-all ${selectedAmPm === 'AM' ? 'opacity-100 font-bold' : 'opacity-30 hover:opacity-70'}`}
                        >
                          AM
                        </button>
                        <button 
                          onClick={() => setSelectedAmPm('PM')} 
                          className={`text-[9px] font-mono transition-all ${selectedAmPm === 'PM' ? 'opacity-100 font-bold' : 'opacity-30 hover:opacity-70'}`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <button onClick={handleAddEvent} disabled={!inputValue.trim()} className={`py-2 px-6 flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest uppercase rounded-full border transition-all ${isDark ? 'border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent' : 'border-black/20 hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent'}`}>
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
