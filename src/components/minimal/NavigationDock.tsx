/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Bell, Aperture, Square, Sun, Moon, MessageSquare } from 'lucide-react';
import { useInbox } from '@/context/InboxContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useProfile } from '@/context/ProfileContext';

interface NavigationDockProps {
  theme: string;
  setTheme: (theme: string) => void;
  onHomeClick: () => void;
  onBellClick: () => void;
  onSettingsClick: () => void;
  hasNotifications: boolean;
  pulseTrigger: boolean; // triggers the silent visual heartbeat pulse
}

export default function NavigationDock({
  theme,
  setTheme,
  onHomeClick,
  onBellClick,
  onSettingsClick,
  hasNotifications,
  pulseTrigger
}: NavigationDockProps) {
  const [pulseClass, setPulseClass] = useState(false);
  const { toggleInbox, totalUnread, isOpen: isInboxOpen } = useInbox();
  const { isOpen: isNotificationsOpen, toggleNotifications } = useNotifications();
  const { isOpen: isProfileOpen, toggleProfile } = useProfile();

  const isAnyOpen = isInboxOpen || isNotificationsOpen || isProfileOpen;

  useEffect(() => {
    if (pulseTrigger) {
      setPulseClass(true);
      const timer = setTimeout(() => setPulseClass(false), 2000); // 2 second heartbeat glow
      return () => clearTimeout(timer);
    }
  }, [pulseTrigger]);

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  return (
    <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 h-auto py-4 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isAnyOpen ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}`}>
      <div
        id="global-navigation-pill"
        className={`pointer-events-auto flex flex-col items-center justify-center px-2 py-4 gap-5 rounded-full transition-all duration-700 border ${
          isDark
            ? 'bg-black/55 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
            : 'bg-white/75 border-black/10 text-black shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
        } ${
          pulseClass
            ? isDark
              ? 'ring-2 ring-white/50 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
              : 'ring-2 ring-black/30 border-black/30 shadow-[0_0_30px_rgba(0,0,0,0.15)]'
            : ''
        }`}
      >
        {/* Monolith central square button */}
        <button
          onClick={onHomeClick}
          className={`p-2 rounded-full cursor-pointer transition-all duration-300 transform active:scale-90 hover:scale-105 select-none relative group`}
          title="Monolith Sanctuary Portal"
        >
          {/* A simple solid black or white square */}
          <Square className={`w-4 h-4 fill-current transition-transform duration-300 group-hover:rotate-45`} />
          <span className="absolute right-[140%] top-1/2 -translate-y-1/2 text-[8px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase whitespace-nowrap">
            PORTAL
          </span>
        </button>

        {/* Notifications Icon with dot */}
        <button
          onClick={toggleNotifications}
          className="p-2 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-90 relative group"
          title="Requests Queue"
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDark ? 'bg-white' : 'bg-black'}`}></span>
            </span>
          )}
          <span className="absolute right-[140%] top-1/2 -translate-y-1/2 text-[8px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase whitespace-nowrap">
            PEERS
          </span>
        </button>

        {/* Inbox Button */}
        <button
          onClick={toggleInbox}
          className="p-2 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-90 relative group"
          title="Inbox"
        >
          <MessageSquare className="w-4 h-4" />
          {totalUnread > 0 && (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center">
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 items-center justify-center text-[8px] font-bold text-white border border-black`}>
                {totalUnread}
              </span>
            </span>
          )}
          <span className="absolute right-[140%] top-1/2 -translate-y-1/2 text-[8px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase whitespace-nowrap">
            INBOX
          </span>
        </button>

        {/* Settings button */}
        <button
          onClick={toggleProfile}
          className="p-2 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-90 relative group"
          title="Tactile Calibration"
        >
          <Aperture className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
          <span className="absolute right-[140%] top-1/2 -translate-y-1/2 text-[8px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase whitespace-nowrap">
            CALIBRATE
          </span>
        </button>

        {/* Divider line */}
        <div className={`w-4 h-[1px] ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Tactical Sliding Pill Theme Trigger */}
        <button
          onClick={() => setTheme(isDark ? 'light-canvas' : 'dark-void')}
          className={`relative w-6 h-12 rounded-full border transition-colors duration-500 flex items-center justify-center cursor-pointer select-none ${
            isDark ? 'bg-black/40 border-white/10' : 'bg-neutral-200/50 border-black/5'
          }`}
          title="Toggle System Theme"
        >
          <div 
            className={`absolute w-5 h-5 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${
              isDark 
                ? '-translate-y-2.5 bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.2)]' 
                : 'translate-y-2.5 bg-black text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)]'
            }`}
          >
            {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          </div>
        </button>
      </div>
    </div>
  );
}
