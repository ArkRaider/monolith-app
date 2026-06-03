'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface MinimalPeoplePanelProps {
  isPeoplePanelOpen: boolean;
  isDark: boolean;
  peers: any[];
  avatarUrl: string | null;
  displayName: string;
  user: any;
  realHandle: string;
  peerStatuses: Record<string, string>;
  isAdmin: boolean;
  handleKick: (peerId: string, userId?: string) => void;
}

export function MinimalPeoplePanel({
  isPeoplePanelOpen,
  isDark,
  peers,
  avatarUrl,
  displayName,
  user,
  realHandle,
  peerStatuses,
  isAdmin,
  handleKick
}: MinimalPeoplePanelProps) {
  const borderColor = isDark ? 'border-white/10' : 'border-black/10';

  return (
    <AnimatePresence>
      {isPeoplePanelOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className={`fixed left-28 top-6 bottom-6 w-80 z-50 border rounded-[32px] ${isDark ? 'bg-[#181a20]/95 border-white/10' : 'bg-white/95 border-black/10'} backdrop-blur-2xl shadow-2xl flex flex-col`}
        >
          <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
            <h2 className="text-lg font-bold">Participants ({peers.length + 1})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Local User */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}>
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full border border-white/10" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border border-white/10 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    {user?.firstName?.[0] || displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? 'border-[#181a20]' : 'border-white'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{displayName} (You)</p>
                <p className="text-xs opacity-50 truncate">@{realHandle}</p>
              </div>
            </div>
            
            {/* Peers */}
            {peers.map(peer => (
              <div key={peer.peerID} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors group`}>
                <div className="flex-shrink-0 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-white/10 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    {peer.user?.firstName?.[0] || (peer.user?.handle || 'U').charAt(0).toUpperCase()}
                  </div>
                   <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? 'border-[#181a20]' : 'border-white'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{peer.user?.handle}</p>
                  <p className="text-xs opacity-50 truncate">
                    {peerStatuses[peer.peerID] ? peerStatuses[peer.peerID] : 'In room'}
                  </p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleKick(peer.peerID, peer.user?.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove user"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
