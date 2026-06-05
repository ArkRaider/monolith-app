'use client';

import { MinimalLocalVideoPod } from '@/components/minimal/MinimalLocalVideoPod';
import { MinimalRemoteVideoPod } from '@/components/minimal/MinimalRemoteVideoPod';
import { Socket } from 'socket.io-client';
import { useRef } from 'react';
import { useOptimalGrid } from '@/hooks/useOptimalGrid';

interface MinimalVideoGridProps {
  cameraError: boolean;
  displayItems: any[];
  localStream: MediaStream | null;
  localState: 'grid' | 'minimized' | 'hidden';
  setLocalState: (state: 'grid' | 'minimized' | 'hidden') => void;
  isVideoOff: boolean;
  displayName: string;
  localHandle: string;
  avatarUrl: string | null;
  isDark: boolean;
  peerStatuses: Record<string, string>;
  socket: Socket | null;
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  switchCamera: (deviceId: string) => void;
  isAdmin: boolean;
  handleKick: (socketId: string, userId?: string) => void;
  pinnedPeers?: string[];
  togglePin?: (peerId: string) => void;
  onViewProfile?: (handle: string) => void;
  onSendMessage?: (handle: string, userId?: string) => void;
}

export function MinimalVideoGrid({
  cameraError,
  displayItems,
  localStream,
  localState,
  setLocalState,
  isVideoOff,
  displayName,
  localHandle,
  avatarUrl,
  isDark,
  peerStatuses,
  socket,
  cameras,
  selectedCamera,
  switchCamera,
  isAdmin,
  handleKick,
  pinnedPeers,
  togglePin,
  onViewProfile,
  onSendMessage
}: MinimalVideoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { itemWidth, itemHeight } = useOptimalGrid(gridRef, displayItems.length);

  return (
    <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center relative">
      {cameraError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-2xl text-center shadow-2xl">
          <span className="text-red-500 font-bold text-sm">Camera Permission Denied.</span>
        </div>
      )}

      <div 
        ref={gridRef}
        className="w-full h-full flex flex-wrap content-center justify-center gap-4"
      >
        {displayItems.map((item, idx) => {
          if (item.type === 'local') {
            return (
              <div 
                key="local" 
                className="relative transition-all duration-300"
                style={{ width: itemWidth > 0 ? itemWidth : '100%', height: itemHeight > 0 ? itemHeight : '100%' }}
              >
                <MinimalLocalVideoPod 
                  stream={localStream} 
                  state={localState} 
                  onStateChange={setLocalState}
                  isVideoOff={isVideoOff}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  isDark={isDark}
                  status={peerStatuses[socket?.id || 'local']}
                  cameras={cameras}
                  selectedCamera={selectedCamera}
                  onCameraSwitch={switchCamera}
                  isPinned={pinnedPeers?.includes('local')}
                  onTogglePin={() => togglePin?.('local')}
                  onSendMessage={() => onSendMessage?.(localHandle, socket?.id || 'local')}
                  onViewProfile={() => onViewProfile?.(localHandle)}
                />
              </div>
            );
          } else {
            const peer = item.peer!;
            return (
              <div 
                key={peer.peerID} 
                className="relative transition-all duration-300"
                style={{ width: itemWidth > 0 ? itemWidth : '100%', height: itemHeight > 0 ? itemHeight : '100%' }}
              >
                <MinimalRemoteVideoPod 
                  peerId={peer.peerID}
                  stream={peer.stream}
                  handle={peer.user?.handle || 'Unknown'}
                  userId={peer.user?.id}
                  isAdmin={isAdmin}
                  onKick={() => handleKick(peer.peerID, peer.user?.id)}
                  isDark={isDark}
                  status={peerStatuses[peer.peerID]}
                  isPinned={pinnedPeers?.includes(peer.peerID)}
                  isDying={peer.isDying}
                  onTogglePin={() => togglePin?.(peer.peerID)}
                  onViewProfile={() => onViewProfile?.(peer.user?.handle || 'Unknown')}
                  onSendMessage={() => onSendMessage?.(peer.user?.handle || 'Unknown', peer.user?.id)}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
