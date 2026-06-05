import { useEffect, useRef, useState } from 'react';
import { Shield, LogOut, Edit3, Heart, VideoOff, Pin, MoreVertical, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalRemoteVideoPodProps {
  peerId: string;
  stream: MediaStream;
  handle: string;
  userId?: string;
  isAdmin: boolean;
  onKick: () => void;
  isDark: boolean;
  status?: string;
  isPinned?: boolean;
  onViewProfile?: () => void;
  onSendMessage?: () => void;
  isDying?: boolean;
  onTogglePin?: () => void;
}

export function MinimalRemoteVideoPod({
  peerId,
  stream,
  handle,
  userId,
  isAdmin,
  onKick,
  isDark,
  status,
  isPinned,
  onTogglePin,
  onViewProfile,
  onSendMessage,
  isDying
}: MinimalRemoteVideoPodProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isVideoActive, setIsVideoActive] = useState(false);

  const trackCount = stream?.getTracks().length || 0;

  // Detect whether the stream has an active video track
  useEffect(() => {
    if (!stream) { queueMicrotask(() => setIsVideoActive(false)); return; }
    
    const checkVideo = () => {
      const videoTracks = stream.getVideoTracks();
      queueMicrotask(() => setIsVideoActive(videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live' && !t.muted)));
    };
    
    const handleAddTrack = (e: MediaStreamTrackEvent) => {
      if (e.track.kind === 'video') {
        e.track.addEventListener('mute', checkVideo);
        e.track.addEventListener('unmute', checkVideo);
      }
      checkVideo();
    };

    checkVideo();
    stream.addEventListener('addtrack', handleAddTrack);
    stream.addEventListener('removetrack', checkVideo);
    
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach(t => {
      t.addEventListener('mute', checkVideo);
      t.addEventListener('unmute', checkVideo);
    });

    return () => {
      stream.removeEventListener('addtrack', handleAddTrack);
      stream.removeEventListener('removetrack', checkVideo);
      videoTracks.forEach(t => {
        t.removeEventListener('mute', checkVideo);
        t.removeEventListener('unmute', checkVideo);
      });
    };
  }, [stream, trackCount]);

  // CRITICAL FIX: Run after every render to ensure srcObject isn't lost
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      // Force play in case autoplay policy or late track arrival caused a black screen pause
      if (!isDying) {
        videoRef.current.play().catch(e => console.warn('MinimalRemoteVideoPod play blocked', e));
      } else {
        videoRef.current.pause();
      }
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isAudioMuted;
    }
  });

  return (
    <div 
      className={`relative w-full h-full rounded-[32px] border group transition-all duration-1000 ${isDying ? 'grayscale blur-md opacity-40' : ''} ${isDark ? 'border-white/10 shadow-2xl' : 'border-black/10 shadow-xl'}`}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      
      {/* Inner wrapper for overflow-hidden elements */}
      <div className={`absolute inset-0 overflow-hidden rounded-[32px] z-0 pointer-events-none ${isDark ? 'bg-[#181a20]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'}`}>
        {/* Video or Avatar */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className={`w-full h-full object-contain aspect-video bg-black/5 block transition-opacity duration-300 ${!isVideoActive ? 'hidden' : 'block'}`}
        />
        
        {!isVideoActive && (
          <div className="w-full h-full flex items-center justify-center relative bg-black/20">
            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {handle.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-16 right-4 p-2 rounded-full bg-black/50 backdrop-blur text-white">
              <VideoOff size={16} />
            </div>
          </div>
        )}

        {/* Simple Audio Indicator */}
        {!isAudioMuted && stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled && !isDying && (
           <div className="absolute bottom-16 right-4 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse z-30" />
        )}

        {/* Tombstone Text */}
        {isDying && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
            <span className="text-white font-medium text-sm animate-pulse tracking-widest">
              Connection Dropped...
            </span>
          </div>
        )}

        {/* Bottom Bar: Name and Status */}
        <div className="absolute bottom-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none drop-shadow-md">
          <div className={`flex items-center gap-2 truncate ${isDark ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]'}`}>
            <span className="text-sm font-medium truncate">{handle}</span>
            {isAdmin && <Shield size={12} className="text-indigo-400 flex-shrink-0" />}
          </div>
          
          {/* Status Pill */}
          {status ? (
            <div className={`flex-1 ml-4 text-right truncate text-xs font-medium opacity-90 ${isDark ? 'text-indigo-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-indigo-800 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]'}`} title={status}>
              {status}
            </div>
          ) : (
            <div className={`flex items-center justify-end gap-1.5 text-xs font-medium opacity-80 shrink-0 ml-4 ${isDark ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]'}`}>
              <Edit3 size={12} /> No status
            </div>
          )}
        </div>
      </div>

      {/* Top action buttons (Admin kick, pin, more options) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onTogglePin}
          className={`p-1.5 rounded-full transition-colors ${isPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          title={isPinned ? "Unpin user" : "Pin user"}
        >
          <Pin size={16} className={isPinned ? 'fill-indigo-400' : ''} />
        </button>

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className={`p-1.5 rounded-full transition-colors ${isMenuOpen ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title="More options"
          >
            <MoreVertical size={16} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`absolute right-full mr-2 top-0 z-50 min-w-[180px] p-[5px] rounded-[10px] border backdrop-blur-[24px] shadow-2xl flex flex-col gap-[2px] ${isDark ? 'bg-[#28282b]/90 border-white/10 shadow-black/50' : 'bg-white/90 border-black/10 shadow-black/10'}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onSendMessage?.();
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white'}`}
                  >
                    <MessageSquare size={14} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white" /> 
                    <span>Send Message</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onViewProfile?.();
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white'}`}
                  >
                    <User size={14} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white" /> 
                    <span>View Profile</span>
                  </button>
                  {isAdmin && (
                    <>
                      <div className={`w-full h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onKick();
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${isDark ? 'text-red-400 hover:bg-red-500 hover:text-white' : 'text-red-500 hover:bg-red-500 hover:text-white'}`}
                      >
                        <LogOut size={14} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white" /> 
                        <span>Kick User</span>
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>




    </div>
  );
}
