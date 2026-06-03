'use client';

import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSignaling } from '@/hooks/useSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LocalVideoPod } from '@/components/LocalVideoPod';
import { RemoteVideoPod } from '@/components/RemoteVideoPod';
import { TaskDeck } from '@/components/TaskDeck';
// import { AIAssistant } from '@/components/AIAssistant';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Palette, PanelRightClose, PanelRightOpen, LogOut, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { toggleSaveRoom } from '@/app/actions/room-actions';
import { getRoomLeaderboard } from '@/app/actions/gamification-actions';
import { useInbox } from '@/context/InboxContext';
import { isRoomAdmin } from '@/lib/roles';
import { StudioCanvas } from '@/components/room/StudioCanvas';

interface StudioClientProps {
  slug: string;
  initialPwd?: string;
  roomId?: string;
  initialIsSaved?: boolean;
  creatorId?: string;
  capacity?: number;
  currentUserHandle?: string;
  currentDisplayName?: string;
  isCurated?: boolean;
}

export default function StudioClient({ slug, initialPwd, roomId, initialIsSaved, creatorId, capacity = 0, currentUserHandle, currentDisplayName, isCurated }: StudioClientProps) {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const pwd = initialPwd || searchParams.get('pwd') || undefined;
  const initCam = searchParams.get('cam') !== '0';
  const initMic = !isCurated && searchParams.get('mic') !== '0';

  const [maxPods, setMaxPods] = useState(6);
  const [localState, setLocalState] = useState<'grid' | 'minimized' | 'hidden'>('grid');
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [videoMinimized, setVideoMinimized] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [topHovered, setTopHovered] = useState(false);
  const [isToolbarMinimized, setIsToolbarMinimized] = useState(true);

  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toggleInbox, totalUnread } = useInbox();

  const themesList = [
    { id: 'structural-brutalist', name: 'Structural Brutalist', icon: '🏛️' },
    { id: 'lofi-aesthetic', name: 'Lofi Aesthetic', icon: '🎧' },
    { id: 'dark-academia', name: 'Dark Academia', icon: '🕰️' },
    { id: 'light-academia', name: 'Light Academia', icon: '📜' },
    { id: 'pastel-dream', name: 'Pastel Dream', icon: '☁️' },
    { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', icon: '🦾' },
    { id: 'deep-abyss', name: 'Deep Abyss', icon: '🌊' },
    { id: 'matcha-zen', name: 'Matcha Zen', icon: '🍵' },
    { id: 'monochrome', name: 'Monochrome', icon: '⬛' },
    { id: 'metallic-silver', name: 'Metallic Silver', icon: '💿' },
    { id: 'sunset-vaporwave', name: 'Sunset Vaporwave', icon: '🌅' }
  ];

  // ── Static identity — no Math.random(), no Date.now() ────────────────────────
  const displayName  = currentDisplayName || user?.username || user?.firstName || 'Guest';
  const activeUserId = user?.id       || 'guest_user';
  const avatarUrl    = user?.imageUrl  || null;
  const realHandle   = currentUserHandle || displayName;

  // Stable object for useSignaling — shape matches what the hook expects.
  const currentUser = { handle: realHandle, id: activeUserId, displayName };
  const isAdmin = isRoomAdmin(activeUserId, creatorId);

  const { isConnected, messages, sendMessage, socket } = useSignaling(slug, currentUser, pwd);

  const handleKick = (targetSocketId: string, targetUserId?: string) => {
    if (!socket || !slug) return;
    socket.emit('admin:kick_user', { roomId: slug, targetUserId, targetSocketId });
  };
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // GAMIFICATION STATE
  interface LeaderboardEntry {
    id: string;
    handle: string;
    totalMinutes: number;
    title: string;
  }
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (slug) {
      localStorage.setItem('lastRoomId', slug);
    }
  }, [slug]);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
       // Only ping if the user actually has stream tracks enabled to prevent AFK farming
       socket.emit('activity:ping');
    }, 60000); // 1-minute heartbeat
    
    const handleKicked = () => {
      alert("You have been removed from the room by the admin.");
      if (socket.connected) socket.disconnect();
      router.push('/dashboard');
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleToggleSave = async () => {
    if (!roomId) return;
    setIsSaving(true);
    const previousState = isSaved;
    setIsSaved(!isSaved); // Optimistic UI update
    try {
      const formData = new FormData();
      formData.append('roomId', roomId);
      await toggleSaveRoom(formData);
    } catch (error) {
      console.error('Failed to toggle save room', error);
      setIsSaved(previousState); // Revert on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (capacity === 1 && roomId) {
      // Auto-delete temporary solo rooms when leaving
      try {
        await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete temporary room', err);
      }
    }
    router.push('/dashboard');
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted; 
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff; 
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // ── Stop sharing: revert to camera ──────────────────────────────────
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // audio track is already live in localStream
        });
        const camTrack = camStream.getVideoTracks()[0];

        // Replace track in every peer RTCPeerConnection (no re-signaling needed)
        peers.forEach(peer => {
          const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });

        // Build fresh MediaStream so React re-renders LocalVideoPod cleanly
        if (localStream) {
          const freshStream = new MediaStream([
            camTrack,
            ...localStream.getAudioTracks(),
          ]);
          setLocalStream(freshStream);
          // Stop old video tracks after swapping
          localStream.getVideoTracks().forEach(t => t.stop());
        }

        setIsScreenSharing(false);
        setIsVideoOff(false);

      } else {
        // ── Start sharing: capture display ───────────────────────────────────
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack  = displayStream.getVideoTracks()[0];

        // Replace track in every peer RTCPeerConnection (no re-signaling needed)
        peers.forEach(peer => {
          const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        // Build fresh MediaStream so React re-renders LocalVideoPod cleanly
        if (localStream) {
          const freshStream = new MediaStream([
            screenTrack,
            ...localStream.getAudioTracks(),
          ]);
          setLocalStream(freshStream);
          // Stop old camera track after swapping
          localStream.getVideoTracks().forEach(t => t.stop());
        }

        setIsScreenSharing(true);

        // Auto-revert when user clicks the browser "Stop sharing" button
        screenTrack.onended = () => {
          setIsScreenSharing(prev => {
            if (prev) toggleScreenShare(); // use latest closure
            return prev;
          });
        };
      }
    } catch (err) {
      console.error('[toggleScreenShare]', err);
    }
  };

  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'people' | 'ambience' | 'leaderboard' | 'tasks' | 'engine'>('chat');
  const [chatInput, setChatInput] = useState('');
  
  useEffect(() => {
    if (activeTab === 'leaderboard' && slug) {
      getRoomLeaderboard(slug).then(setLeaderboard);
    }
  }, [activeTab, slug]);
  
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleChatSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const displayPeers = peers.slice(0, maxPods - 1);

  // ── Guard: wait for Clerk before rendering anything dynamic ─────────────────
  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-[family-name:var(--font-primary)]">
      <div className="flex-grow flex flex-row min-h-0">
        <main className="flex-1 flex flex-col relative" ref={constraintsRef}>
        
        {/* Header */}
        <div className="relative z-50">
          <AnimatePresence>
            {!zenMode && (
              <motion.header
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 56, opacity: 1 }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                className="border-b-[length:var(--border-weight)] border-border flex items-center justify-between px-6 bg-surface"
              >
                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-primary)] text-xs text-secondary px-2 border-l-[length:var(--border-weight)] border-border">
                    {isConnected ? 'LIVE' : 'CONNECTING...'}
                  </span>
                </div>

                {/* Minimal Theme Switcher */}
                <div className="flex items-center">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-2 border border-border text-foreground bg-background hover:bg-border active:scale-95 transition-all outline-none">
                        <Palette size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        className="min-w-[200px] max-h-[400px] overflow-y-auto bg-surface-high border border-border p-2 font-[family-name:var(--font-primary)] text-sm z-50 shadow-[var(--ui-shadow)]" 
                        align="end" 
                        sideOffset={8}
                      >
                        <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-secondary font-bold">
                          Aesthetics
                        </div>
                        {themesList.map((t) => (
                          <DropdownMenu.Item 
                            key={t.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-border outline-none text-foreground flex justify-between ${theme === t.id ? 'bg-border/50 text-primary' : ''}`}
                            onClick={() => setTheme(t.id)}
                          >
                            <span>{t.name}</span>
                            <span>{t.icon}</span>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          {capacity === 1 && (
            <div 
              className="absolute top-0 left-0 w-full h-12 z-50 flex justify-center items-start pt-2 pointer-events-none"
            >
              <div 
                className="pointer-events-auto w-full max-w-lg h-full flex justify-center"
                onMouseEnter={() => setTopHovered(true)}
                onMouseLeave={() => setTopHovered(false)}
              >
                <AnimatePresence>
                  {topHovered && (
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => setZenMode(!zenMode)}
                      className="bg-surface/90 backdrop-blur-md border border-border p-2 rounded-full shadow-2xl text-foreground hover:bg-surface-high transition-colors mt-1 pointer-events-auto"
                    >
                      {zenMode ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/50 rounded-[var(--radius)] flex items-center justify-center text-center z-10 shrink-0">
            <span className="text-red-500 font-bold text-sm">
              Camera Permission Denied. Please allow camera and microphone access in your browser settings to join the room fully.
            </span>
          </div>
        )}

        {/* Video Grid or Solo Studio Grid */}
        {capacity === 1 ? (
          <div className="flex-1 relative overflow-hidden bg-transparent">
            <StudioCanvas 
              isVideoOff={isVideoOff}
              videoMinimized={videoMinimized}
              onVideoMinimizeToggle={setVideoMinimized}
              videoPod={
                <LocalVideoPod 
                  stream={localStream} 
                  state={localState} 
                  onStateChange={setLocalState}
                  isVideoOff={isVideoOff}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                />
              } 
            />
          </div>
        ) : (
          <div className="flex-1 p-4 pb-6 flex flex-wrap content-center justify-center gap-4 overflow-y-auto">
            {localState === 'grid' && (
              <div className="relative aspect-video flex-grow basis-[300px] max-w-[800px] min-w-[280px]">
                <LocalVideoPod 
                  stream={localStream} 
                  state={localState} 
                  onStateChange={setLocalState}
                  isVideoOff={isVideoOff}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                />
              </div>
            )}
            {displayPeers.map(peer => (
              <div key={peer.peerID} className="relative aspect-video flex-grow basis-[300px] max-w-[800px] min-w-[280px]">
                <RemoteVideoPod 
                  stream={peer.stream}
                  handle={peer.user?.handle || 'Unknown'}
                  userId={peer.user?.id}
                  isAdmin={isAdmin}
                  onKick={() => handleKick(peer.peerID, peer.user?.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Local Minimized Pip */}
        <AnimatePresence>
          {localState === 'minimized' && (
            <motion.div
              drag
              dragConstraints={constraintsRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-6 left-6 w-48 h-32 z-50 cursor-grab active:cursor-grabbing shadow-[var(--ui-shadow)]"
            >
              <LocalVideoPod 
                stream={localStream} 
                state={localState} 
                onStateChange={setLocalState} 
                isVideoOff={isVideoOff}
                displayName={displayName}
                avatarUrl={avatarUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>

        </main>

        {/* Right Panel */}
        {panelOpen && capacity !== 1 && (
            <aside className="w-80 border-l-[length:var(--border-weight)] border-border bg-surface flex flex-col z-20 shrink-0">
            <div className="flex border-b border-border flex-wrap">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 min-w-[30%] py-3 text-[10px] font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('people')}
              className={`flex-1 min-w-[30%] py-3 text-[10px] font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${activeTab === 'people' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              People ({peers.length + 1})
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 min-w-[30%] py-3 text-[10px] font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${activeTab === 'tasks' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              Tasks
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 min-w-[30%] py-3 text-[10px] font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${activeTab === 'leaderboard' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
            >
              Ranks
            </button>
          </div>

          {activeTab === 'tasks' ? (
            <div className="flex-1 overflow-hidden">
               {isLoaded && user ? (
                 <TaskDeck userId={user.id} />
               ) : (
                 <div className="flex items-center justify-center h-full text-[10px] text-secondary font-[family-name:var(--font-primary)] uppercase tracking-widest">
                   [ AUTHENTICATING... ]
                 </div>
               )}
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'chat' && (
              <div className="flex flex-col gap-4">
                {messages.map((m, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
                      {m.sender?.handle || 'Unknown'} • {m.time}
                    </span>
                    <p className="text-sm text-foreground">{m.text}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'people' && (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-2 border border-border text-foreground font-[family-name:var(--font-primary)] text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-bold">{currentUser.handle} <span className="text-secondary font-normal">(You)</span></span>
                  </div>
                </div>
                
                {peers.map(peer => (
                  <div key={peer.peerID} className="px-3 py-2 border border-border text-foreground font-[family-name:var(--font-primary)] text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="font-bold">{peer.user?.handle || 'Unknown'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-2 bg-surface-high border-[length:var(--border-weight)] border-border text-foreground font-[family-name:var(--font-primary)] text-xs uppercase font-bold tracking-widest text-center mb-2">
                  Top Scholars
                </div>
                {leaderboard.length === 0 && (
                  <div className="text-center text-secondary text-xs mt-4">No data yet. Keep grinding!</div>
                )}
                {leaderboard.map((u, i) => (
                  <div key={u.id} className="p-3 border-[length:var(--border-weight)] border-border text-foreground font-[family-name:var(--font-primary)] text-sm flex flex-col gap-1 rounded-[var(--radius)]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2">
                        <span className="text-secondary text-xs">#{i + 1}</span> {u.handle}
                      </span>
                      <span className="font-bold text-primary">{u.totalMinutes}m</span>
                    </div>
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">[{u.title}]</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeTab === 'chat' && (
            <div className="p-4 border-t border-border">
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatSubmit}
                placeholder="Message room..."
                className="w-full bg-background border border-border px-3 py-2 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border"
              />
            </div>
          )}
        </aside>
        )}
      </div>

      {/* Floating Bottom Dock */}
      <AnimatePresence mode="wait">
        {!zenMode && isToolbarMinimized && (
          <motion.button
            key="dash"
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsToolbarMinimized(false)}
            className="absolute bottom-6 left-1/2 z-50 w-16 h-1.5 rounded-full bg-foreground/30 hover:bg-foreground/50 transition-colors shadow-lg"
          />
        )}
        {!zenMode && !isToolbarMinimized && (
          <motion.footer
            key="full"
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-6 left-1/2 z-50 flex flex-col items-center gap-2 font-[family-name:var(--font-primary)]"
          >
            <div className="flex items-center gap-4 px-6 py-3 rounded-[2rem] backdrop-blur-3xl border shadow-2xl bg-surface/50 border-border/50">
              {/* Nav */}
              <button onClick={handleLeaveRoom} className="p-3 rounded-full border transition-all hover:scale-105 active:scale-95 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20">
                <LogOut size={18} /> 
              </button>

              <div className="w-px h-8 bg-foreground/10" />

              {/* Core Controls */}
              {roomId && (
                <button 
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  className={`px-5 py-3 text-xs font-bold tracking-[0.15em] rounded-full uppercase transition-all hover:scale-105 active:scale-95 ${isSaved ? 'bg-foreground text-background' : 'bg-surface/50 text-foreground hover:bg-surface'}`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              )}

              {!isCurated && (
                <button 
                  onClick={toggleAudio}
                  className={`px-5 py-3 text-xs font-bold tracking-[0.15em] rounded-full uppercase transition-all hover:scale-105 active:scale-95 ${!isAudioMuted ? 'bg-foreground text-background' : 'bg-surface/50 text-foreground hover:bg-surface'}`}
                >
                  {!isAudioMuted ? 'Mic On' : 'Mic Off'}
                </button>
              )}
              
              <button 
                onClick={toggleVideo}
                className={`px-5 py-3 text-xs font-bold tracking-[0.15em] rounded-full uppercase transition-all hover:scale-105 active:scale-95 ${!isVideoOff ? 'bg-foreground text-background' : 'bg-surface/50 text-foreground hover:bg-surface'}`}
              >
                {!isVideoOff ? 'Cam On' : 'Cam Off'}
              </button>

              <button 
                onClick={toggleScreenShare}
                className={`px-5 py-3 text-xs font-bold tracking-[0.15em] rounded-full uppercase transition-all hover:scale-105 active:scale-95 ${isScreenSharing ? 'bg-foreground text-background' : 'bg-surface/50 text-foreground hover:bg-surface'}`}
              >
                {isScreenSharing ? 'Sharing' : 'Share'}
              </button>
              
              <div className="w-px h-8 bg-foreground/10" />

              {/* DMs / Panel Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleInbox}
                  className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 relative bg-surface/50 text-foreground hover:bg-surface`}
                >
                  <MessageSquare size={18} />
                  {totalUnread > 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setPanelOpen(!panelOpen)}
                  className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 bg-surface/50 text-foreground hover:bg-surface ${capacity === 1 ? 'hidden' : ''}`}
                >
                  {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsToolbarMinimized(true)}
              className="p-1 rounded-full bg-surface/50 border border-border/50 text-secondary hover:text-foreground transition-colors hover:bg-surface shadow-md"
            >
              <ChevronDown size={14} />
            </button>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}