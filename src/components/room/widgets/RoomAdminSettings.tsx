'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, VolumeX, UserMinus, MessageSquareOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Socket } from 'socket.io-client';

interface RoomAdminSettingsProps {
  socket: Socket | null;
  roomId: string;
  peers: { socketId: string; user: any }[];
}

export function RoomAdminSettings({ socket, roomId, peers }: RoomAdminSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [globalChatEnabled, setGlobalChatEnabled] = useState(true);
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

  const handleMuteAll = () => {
    if (!socket) return;
    peers.forEach(peer => {
      socket.emit('admin:mute', { targetSocketId: peer.socketId, roomId });
    });
  };

  const handleKick = (targetSocketId: string, targetUserId: string) => {
    if (!socket) return;
    socket.emit('admin:kick_user', { targetSocketId, targetUserId, roomId });
  };

  const handleToggleChat = () => {
    if (!socket) return;
    const newState = !globalChatEnabled;
    setGlobalChatEnabled(newState);
    socket.emit('admin:toggle_chat', { roomId, enabled: newState });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center group"
        title="Room Admin Settings"
      >
        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[120%] right-0 mb-4 w-72 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50"
          >
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold text-white tracking-wide uppercase text-sm">Admin Controls</h3>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              <button 
                onClick={handleMuteAll}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 text-white/80 hover:text-white text-sm"
              >
                <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
                  <VolumeX className="w-4 h-4" />
                </div>
                Force Mute All Guests
              </button>

              <button 
                onClick={handleToggleChat}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 text-white/80 hover:text-white text-sm"
              >
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  {globalChatEnabled ? <MessageSquareOff className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                {globalChatEnabled ? 'Disable Global Chat' : 'Enable Global Chat'}
              </button>
            </div>

            {peers.length > 0 && (
              <>
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                  <span className="text-xs uppercase text-white/40 font-bold tracking-wider">Manage Guests</span>
                </div>
                <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden p-2 flex flex-col gap-1">
                  {peers.map((peer) => (
                    <div key={peer.socketId} className="flex items-center justify-between px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
                      <span className="text-sm text-white/80 truncate max-w-[120px]">
                        {peer.user?.handle || 'Guest'}
                      </span>
                      <button
                        onClick={() => handleKick(peer.socketId, peer.user?.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title={`Kick ${peer.user?.handle || 'Guest'}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
