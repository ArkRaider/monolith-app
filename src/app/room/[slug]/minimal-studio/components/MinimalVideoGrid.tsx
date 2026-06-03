'use client';

import { MinimalLocalVideoPod } from '@/components/minimal/MinimalLocalVideoPod';
import { MinimalRemoteVideoPod } from '@/components/minimal/MinimalRemoteVideoPod';
import { Socket } from 'socket.io-client';

interface MinimalVideoGridProps {
  cameraError: boolean;
  displayItems: any[];
  localStream: MediaStream | null;
  localState: 'grid' | 'minimized' | 'hidden';
  setLocalState: (state: 'grid' | 'minimized' | 'hidden') => void;
  isVideoOff: boolean;
  displayName: string;
  avatarUrl: string | null;
  isDark: boolean;
  peerStatuses: Record<string, string>;
  socket: Socket | null;
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  switchCamera: (deviceId: string) => void;
  isAdmin: boolean;
  handleKick: (socketId: string, userId?: string) => void;
}

export function MinimalVideoGrid({
  cameraError,
  displayItems,
  localStream,
  localState,
  setLocalState,
  isVideoOff,
  displayName,
  avatarUrl,
  isDark,
  peerStatuses,
  socket,
  cameras,
  selectedCamera,
  switchCamera,
  isAdmin,
  handleKick
}: MinimalVideoGridProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center relative">
      {cameraError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-2xl text-center shadow-2xl">
          <span className="text-red-500 font-bold text-sm">Camera Permission Denied.</span>
        </div>
      )}

      <div 
        className="w-full h-full flex flex-wrap content-center justify-center gap-4 p-2"
      >
        {displayItems.map((item, idx) => {
          if (item.type === 'local') {
            return (
              <div key="local" className="relative aspect-video flex-grow basis-[300px] max-w-[800px] min-w-[280px]">
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
                />
              </div>
            );
          } else {
            const peer = item.peer!;
            return (
              <div key={peer.peerID} className="relative aspect-video flex-grow basis-[300px] max-w-[800px] min-w-[280px]">
                <MinimalRemoteVideoPod 
                  peerId={peer.peerID}
                  stream={peer.stream}
                  handle={peer.user?.handle || 'Unknown'}
                  userId={peer.user?.id}
                  isAdmin={isAdmin}
                  onKick={() => handleKick(peer.peerID, peer.user?.id)}
                  isDark={isDark}
                  status={peerStatuses[peer.peerID]}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
