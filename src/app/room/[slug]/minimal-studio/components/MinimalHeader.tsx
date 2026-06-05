'use client';

import { Dispatch, SetStateAction } from 'react';
import { Search, MessageSquare, Clock, Video, Edit3, ChevronDown, ChevronLeft, ChevronRight, Users, Pin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationBell } from '@/components/room/widgets/NotificationBell';
import { RoomAdminSettings } from '@/components/room/widgets/RoomAdminSettings';
import { Socket } from 'socket.io-client';

interface MinimalHeaderProps {
  isDark: boolean;
  handleLeaveRoom: () => void;
  totalUnread: number;
  toggleInbox: () => void;
  setIsFocusPlus: (val: boolean) => void;
  isAdmin: boolean;
  socket: Socket | null;
  slug: string;
  peers: any[];
  userFirstName?: string;
  displayName: string;
  avatarUrl: string | null;
  isVideoOff: boolean;
  toggleVideo: () => void;
  isCameraDropdownOpen: boolean;
  setIsCameraDropdownOpen: Dispatch<SetStateAction<boolean>>;
  cameras: MediaDeviceInfo[];
  switchCamera: (deviceId: string) => void;
  selectedCamera: string;
  showStatusInput: boolean;
  setShowStatusInput: Dispatch<SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  showOnlyPinned?: boolean;
  setShowOnlyPinned?: Dispatch<SetStateAction<boolean>>;
  pinnedCount?: number;
}

export function MinimalHeader({
  isDark,
  handleLeaveRoom,
  totalUnread,
  toggleInbox,
  setIsFocusPlus,
  isAdmin,
  socket,
  slug,
  peers,
  userFirstName,
  displayName,
  avatarUrl,
  isVideoOff,
  toggleVideo,
  isCameraDropdownOpen,
  setIsCameraDropdownOpen,
  cameras,
  switchCamera,
  selectedCamera,
  showStatusInput,
  setShowStatusInput,
  currentPage,
  setCurrentPage,
  totalPages,
  showOnlyPinned,
  setShowOnlyPinned,
  pinnedCount
}: MinimalHeaderProps) {
  const borderColor = isDark ? 'border-white/5' : 'border-black/5';

  return (
    <div className={`fixed top-6 left-[104px] right-6 z-40 rounded-[32px] border backdrop-blur-2xl transition-all duration-700 flex flex-col ${isDark ? 'bg-neutral-950/70 border-white/10 shadow-2xl' : 'bg-white/70 border-black/10 shadow-xl'}`}>
      <header className={`h-16 px-6 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-center gap-4">
          <button onClick={handleLeaveRoom} className={`px-5 py-2 rounded-full font-medium text-sm transition-colors border ${isDark ? 'bg-white/10 text-white hover:bg-white/20 border-white/10' : 'bg-black/5 text-black hover:bg-black/10 border-black/10'}`}>
            Finish session
          </button>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${borderColor} ${isDark ? 'bg-black/20' : 'bg-black/5'} w-64`}>
            <Search size={14} className="opacity-50" />
            <input type="text" placeholder="Search app users..." className="bg-transparent text-sm outline-none w-full placeholder:opacity-50" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 ml-2">
            <NotificationBell />
            <button onClick={toggleInbox} className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all relative flex items-center justify-center">
              <MessageSquare size={20} />
              {totalUnread > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-neutral-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] text-white">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setIsFocusPlus(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>
            <Clock size={14} /> Focus+
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <RoomAdminSettings socket={socket} roomId={slug} peers={peers.map(p => ({ socketId: p.peerID, user: p.user }))} />
            )}
          </div>
          <div className="text-xs font-medium opacity-70">
            You
          </div>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full ml-2 border border-white/10" />
          ) : (
            <div className={`w-8 h-8 rounded-full ml-2 flex items-center justify-center font-bold text-xs ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
              {userFirstName?.[0] || displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Sub Navbar (Action Bar) */}
      <div className={`h-14 px-6 flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex items-center">
              <button onClick={toggleVideo} className={`flex items-center gap-2 text-xs font-medium ${!isVideoOff ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${!isVideoOff ? (isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black') : isDark ? 'bg-white/10' : 'bg-black/10'}`}><Video size={12} /></div>
                Video
              </button>
              <button onClick={() => setIsCameraDropdownOpen(!isCameraDropdownOpen)} className={`ml-1 p-1 rounded hover:bg-black/10 opacity-70 hover:opacity-100`}>
                <ChevronDown size={14} />
              </button>
            </div>
            <AnimatePresence>
              {isCameraDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className={`absolute top-full left-0 mt-2 min-w-[200px] p-[5px] rounded-[10px] border backdrop-blur-[24px] shadow-2xl z-50 flex flex-col gap-[2px] ${isDark ? 'bg-[#28282b]/90 border-white/10 shadow-black/50' : 'bg-white/90 border-black/10 shadow-black/10'}`}
                >
                  {cameras.length === 0 && <div className="px-2 py-2 text-[13px] opacity-50 text-center">No cameras found</div>}
                  {cameras.map(cam => (
                    <button 
                      key={cam.deviceId}
                      onClick={() => { switchCamera(cam.deviceId); setIsCameraDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-[5px] text-[13px] font-medium rounded-[5px] truncate transition-colors ${
                        selectedCamera === cam.deviceId 
                          ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                          : (isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white')
                      }`}
                    >
                      {cam.label || `Camera ${cam.deviceId.slice(0,5)}`}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowStatusInput(!showStatusInput)} className="flex items-center gap-2 text-xs font-medium opacity-70 hover:opacity-100 relative">
            <div className="w-6 h-6 rounded bg-green-500/20 text-green-500 flex items-center justify-center"><Edit3 size={12} /></div>
            Tile message
          </button>
        </div>

        <div className="flex items-center gap-4">
          {totalPages > 1 && (
            <div className="flex items-center gap-3 text-sm font-medium opacity-70">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="hover:opacity-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hover:opacity-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {pinnedCount !== undefined && pinnedCount > 0 && (
              <button 
                onClick={() => setShowOnlyPinned?.(!showOnlyPinned)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showOnlyPinned ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
              >
                <Pin size={12} className={showOnlyPinned ? 'fill-indigo-400' : ''} /> {showOnlyPinned ? 'Pinned only' : 'Show pinned'}
              </button>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <Users size={12} /> {peers.length + 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
