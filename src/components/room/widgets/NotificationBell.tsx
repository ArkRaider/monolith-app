'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { Bell, MessageSquare, ShieldAlert, UserPlus, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBell({ 
  onApproveJoinRequest,
  onDenyJoinRequest 
}: { 
  onApproveJoinRequest?: (notif: AppNotification) => void;
  onDenyJoinRequest?: (notif: AppNotification) => void;
}) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'admin': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'join_request': return <UserPlus className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-white/60" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all relative flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[120%] right-0 mt-4 w-80 bg-[#1e1e20]/70 backdrop-blur-[40px] border border-white/10 rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-50 ring-1 ring-white/5"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-medium text-sm text-white/90">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No new notifications
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-white/5 transition-colors cursor-pointer ${
                        notif.read ? 'opacity-60 hover:bg-white/5' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          {notif.senderName && (
                            <div className="font-medium text-sm text-white/90">
                              {notif.senderName}
                            </div>
                          )}
                          <div className="text-sm text-white/70 mt-0.5 leading-relaxed">
                            {notif.message}
                          </div>
                          <div className="text-xs text-white/40 mt-2">
                            {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          {notif.type === 'join_request' && !notif.read && (
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onApproveJoinRequest) onApproveJoinRequest(notif);
                                  markAsRead(notif.id);
                                }}
                                className="flex-1 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDenyJoinRequest) onDenyJoinRequest(notif);
                                  markAsRead(notif.id);
                                }}
                                className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" /> Deny
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
