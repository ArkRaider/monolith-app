'use client';

import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSignaling } from '@/hooks/useSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { MinimalLocalVideoPod } from '@/components/minimal/MinimalLocalVideoPod';
import { MinimalRemoteVideoPod } from '@/components/minimal/MinimalRemoteVideoPod';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Home, Users, MessageSquare, Shield, Settings, Bell, Search, Clock, LogOut, ChevronLeft, ChevronRight, Pin, Heart, Video, Edit3, User, Flame, Moon, Sun, ChevronDown } from 'lucide-react';
import { getRoomLeaderboard } from '@/app/actions/gamification-actions';
import { useInbox } from '@/context/InboxContext';
import { isRoomAdmin } from '@/lib/roles';
import InteractiveCanvas from '@/components/minimal/InteractiveCanvas';
import CursorGlow from '@/components/minimal/CursorGlow';
import { NotificationBell } from '@/components/room/widgets/NotificationBell';
import { RoomAdminSettings } from '@/components/room/widgets/RoomAdminSettings';

import { MinimalSidebar } from './components/MinimalSidebar';
import { MinimalPeoplePanel } from './components/MinimalPeoplePanel';
import { MinimalHeader } from './components/MinimalHeader';
import { MinimalVideoGrid } from './components/MinimalVideoGrid';

const FocusClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-[12rem] md:text-[16rem] font-bold tracking-tighter opacity-90 select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};

interface StudioClientProps {
  slug: string;
  initialPwd?: string;
  roomId?: string;
  initialIsSaved?: boolean;
  creatorId?: string;
  capacity?: number;
  currentUserHandle?: string;
  currentDisplayName?: string;
}

export default function MinimalStudioClient({ slug, initialPwd, roomId, initialIsSaved, creatorId, capacity = 0, currentUserHandle, currentDisplayName }: StudioClientProps) {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const pwd = initialPwd || searchParams.get('pwd') || undefined;
  const initCam = searchParams.get('cam') !== '0';
  const initMic = searchParams.get('mic') !== '0';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show more pods in spacious layout
  const [localState, setLocalState] = useState<'grid' | 'minimized' | 'hidden'>('grid');
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isFocusPlus, setIsFocusPlus] = useState(false);
  const [isPeoplePanelOpen, setIsPeoplePanelOpen] = useState(false);

  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { totalUnread, toggleInbox } = useInbox();

  const displayName  = currentDisplayName || user?.username || user?.firstName || 'Guest';
  const activeUserId = user?.id       || 'guest_user';
  const avatarUrl    = user?.imageUrl  || null;
  const realHandle   = currentUserHandle || displayName;

  const currentUser = { handle: realHandle, id: activeUserId, displayName };
  const isAdmin = isRoomAdmin(activeUserId, creatorId);

  const { isConnected, socket, peerStatuses, activeReactions, sendStatus, sendReaction } = useSignaling(slug, currentUser, pwd);

  const handleKick = (targetSocketId: string, targetUserId?: string) => {
    if (!socket || !slug) return;
    socket.emit('admin:kick_user', { roomId: slug, targetUserId, targetSocketId });
  };
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (slug) {
      localStorage.setItem('lastRoomId', slug);
    }
  }, [slug]);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
       socket.emit('activity:ping');
    }, 60000); 
    
    const handleKicked = () => {
      alert("You have been removed from the room by the admin.");
      if (socket.connected) socket.disconnect();
      router.push('/dashboard/minimal');
    };
    
    socket.on('kicked_from_room', handleKicked);
    return () => {
      clearInterval(interval);
      socket.off('kicked_from_room', handleKicked);
    };
  }, [socket, router]);

  useEffect(() => {
    if (!initCam && !initMic) return;
    
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: initCam, audio: initMic });
        setLocalStream(stream);
        setCameraError(false);
      } catch (err) {
        console.error('Failed to access media devices', err);
        setCameraError(true);
      }
    };
    
    initMedia();
  }, [initCam, initMic]);

  const { peers } = useWebRTC(localStream);

  const [isVideoOff, setIsVideoOff] = useState(!initCam);
  const [isAudioMuted, setIsAudioMuted] = useState(!initMic);

  const handleLeaveRoom = async () => {
    if (capacity === 1 && roomId) {
      try {
        await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      } catch (err) {}
    }
    router.push('/dashboard/minimal');
  };

  const toggleAudio = async () => {
    if (!localStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(stream);
        setIsAudioMuted(false);
      } catch (err) {
        console.error(err);
      }
      return;
    }
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getAudioTracks().forEach(t => localStream.addTrack(t));
        setIsAudioMuted(false);
      } catch (err) {
        console.error(err);
      }
    } else {
      audioTracks.forEach(track => { track.enabled = isAudioMuted; });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);

  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoInputs);
      if (videoInputs.length > 0 && !selectedCamera) {
        setSelectedCamera(videoInputs[0].deviceId);
      }
    } catch (err) {}
  };

  useEffect(() => {
    getCameras();
    navigator.mediaDevices.addEventListener('devicechange', getCameras);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getCameras);
  }, []);

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (!isVideoOff && localStream) {
      localStream.getVideoTracks().forEach(t => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        localStream.getVideoTracks().forEach(t => localStream.removeTrack(t));
        stream.getVideoTracks().forEach(t => localStream.addTrack(t));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleVideo = async () => {
    if (!localStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true 
        });
        setLocalStream(stream);
        setIsVideoOff(false);
        getCameras();
      } catch (err) {
        console.error(err);
      }
      return;
    }
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true 
        });
        stream.getVideoTracks().forEach(t => localStream.addTrack(t));
        setIsVideoOff(false);
        getCameras();
      } catch (err) {
        console.error(err);
      }
    } else {
      videoTracks.forEach(track => { track.enabled = isVideoOff; });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Status input state
  const [showStatusInput, setShowStatusInput] = useState(false);
  const [statusInput, setStatusInput] = useState('');

  const handleStatusSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendStatus(statusInput.trim());
      setShowStatusInput(false);
    }
  };

  const totalPages = Math.ceil((peers.length + (localState === 'grid' ? 1 : 0)) / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  // If local is in grid, it takes index 0.
  const hasLocalInGrid = localState === 'grid';
  const localOffset = hasLocalInGrid ? 1 : 0;
  
  // Calculate which peers to show
  let displayItems = [];
  if (hasLocalInGrid && currentPage === 1) {
    displayItems.push({ type: 'local' });
    displayItems.push(...peers.slice(0, itemsPerPage - 1).map(p => ({ type: 'remote', peer: p })));
  } else {
    const peerStart = startIndex - localOffset;
    displayItems.push(...peers.slice(peerStart, peerStart + itemsPerPage).map(p => ({ type: 'remote', peer: p })));
  }

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusPlus) {
        setIsFocusPlus(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusPlus]);

  if (!isLoaded) return null;

  const isDark = theme === 'dark-void' || theme === 'dark';
  const bgColor = isDark ? 'bg-[#181a20]' : 'bg-[#f0f2f5]';
  const sidebarColor = isDark ? 'bg-[#1e2128]' : 'bg-white';
  const borderColor = isDark ? 'border-white/5' : 'border-black/5';

  if (isFocusPlus) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center text-white font-[family-name:var(--font-primary)]">
        <FocusClock />
        <button 
          onClick={() => setIsFocusPlus(false)}
          className="absolute bottom-10 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors opacity-0 hover:opacity-100 font-medium tracking-wide"
        >
          Exit Focus+
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-700 font-sans select-text ${isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-950'}`} style={{ backgroundColor: isDark ? '#050505' : '#fafafa' }} ref={constraintsRef}>
      
      {/* Background Ambience from Dashboard */}
      <InteractiveCanvas theme={theme as any} />
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/minimal-assets/images/architectural_void_1780392871749.png"
          alt="Spatial Brutalist Architecture"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-[1200ms] ease-out scale-110 opacity-[0.08] filter blur-xl lg:blur-2xl mix-blend-overlay`}
        />
      </div>

      <CursorGlow />

      <MinimalSidebar
        isDark={isDark}
        setTheme={setTheme}
        isPeoplePanelOpen={isPeoplePanelOpen}
        setIsPeoplePanelOpen={setIsPeoplePanelOpen}
      />

      <MinimalPeoplePanel
        isPeoplePanelOpen={isPeoplePanelOpen}
        isDark={isDark}
        peers={peers}
        avatarUrl={avatarUrl}
        displayName={displayName}
        user={user}
        realHandle={realHandle}
        peerStatuses={peerStatuses}
        isAdmin={isAdmin}
        handleKick={handleKick}
      />

      <MinimalHeader
        isDark={isDark}
        handleLeaveRoom={handleLeaveRoom}
        totalUnread={totalUnread}
        toggleInbox={toggleInbox}
        setIsFocusPlus={setIsFocusPlus}
        isAdmin={isAdmin}
        socket={socket}
        slug={slug}
        peers={peers}
        userFirstName={user?.firstName || undefined}
        displayName={displayName}
        avatarUrl={avatarUrl}
        isVideoOff={isVideoOff}
        toggleVideo={toggleVideo}
        isCameraDropdownOpen={isCameraDropdownOpen}
        setIsCameraDropdownOpen={setIsCameraDropdownOpen}
        cameras={cameras}
        switchCamera={switchCamera}
        selectedCamera={selectedCamera}
        showStatusInput={showStatusInput}
        setShowStatusInput={setShowStatusInput}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* ── Main Content Area ── */}
      <main className="absolute inset-0 pt-[156px] pl-[104px] pr-6 pb-6 flex flex-col z-10">
        
        {/* Status Input Popover */}
        <AnimatePresence>
          {showStatusInput && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-32 left-48 z-50 p-2 rounded-xl border shadow-xl ${isDark ? 'bg-[#2a2d36] border-white/10' : 'bg-white border-black/10'}`}
            >
              <input
                autoFocus
                type="text"
                placeholder="What are you working on?"
                value={statusInput}
                onChange={e => setStatusInput(e.target.value)}
                onKeyDown={handleStatusSubmit}
                className="bg-transparent text-sm outline-none w-64 px-2 py-1"
                maxLength={40}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <MinimalVideoGrid
          cameraError={cameraError}
          displayItems={displayItems}
          localStream={localStream}
          localState={localState}
          setLocalState={setLocalState}
          isVideoOff={isVideoOff}
          displayName={displayName}
          avatarUrl={avatarUrl}
          isDark={isDark}
          peerStatuses={peerStatuses}
          socket={socket}
          cameras={cameras}
          selectedCamera={selectedCamera}
          switchCamera={switchCamera}
          isAdmin={isAdmin}
          handleKick={handleKick}
        />
      </main>

      {/* Local Minimized Pip */}
      <AnimatePresence>
        {localState === 'minimized' && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-6 right-6 w-64 h-48 z-50 cursor-grab active:cursor-grabbing shadow-2xl"
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

            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}