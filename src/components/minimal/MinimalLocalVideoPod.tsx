import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, VideoOff, Edit3, Pin, MoreVertical, User, MessageSquare, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalLocalVideoPodProps {
  stream: MediaStream | null;
  state: 'grid' | 'minimized' | 'hidden';
  onStateChange: (state: 'grid' | 'minimized' | 'hidden') => void;
  isVideoOff: boolean;
  displayName: string;
  avatarUrl: string | null;
  isDark: boolean;
  status?: string;

  cameras?: MediaDeviceInfo[];
  selectedCamera?: string;
  onCameraSwitch?: (deviceId: string) => void;
  
  isPinned?: boolean;
  onTogglePin?: () => void;
  onViewProfile?: () => void;
  onSendMessage?: () => void;
}

export function MinimalLocalVideoPod({ stream, state, onStateChange, isVideoOff, displayName, avatarUrl, isDark, status, cameras = [], selectedCamera, onCameraSwitch, isPinned, onTogglePin, onViewProfile, onSendMessage }: MinimalLocalVideoPodProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (state === 'hidden') return null;

  return (
    <div 
      className={`relative w-full h-full rounded-[32px] border group transition-all duration-300 ${isDark ? 'border-white/10 shadow-2xl' : 'border-black/10 shadow-xl'}`}
      onMouseLeave={() => setIsMenuOpen(false)}
    >

      {/* Inner wrapper for overflow-hidden elements (video, avatar, background) */}
      <div className={`absolute inset-0 overflow-hidden rounded-[32px] z-0 pointer-events-none ${isDark ? 'bg-[#181a20]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'}`}>
        {/* Video or Avatar */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-contain aspect-video bg-black/5 block transition-opacity duration-300 ${isVideoOff ? 'hidden' : 'block'}`}
        />
        
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center relative bg-black/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full border-2 border-white/10 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-16 right-4 p-2 rounded-full bg-black/50 backdrop-blur text-white">
              <VideoOff size={16} />
            </div>
          </div>
        )}

        {/* Bottom Bar: Name and Status */}
        <div className="absolute bottom-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none drop-shadow-md">
          <span className={`text-sm font-medium truncate ${isDark ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]'}`}>{displayName} (You)</span>
          
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

      {/* Top action buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onTogglePin && (
          <button 
            onClick={onTogglePin}
            className={`p-1.5 rounded-full transition-colors ${isPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title={isPinned ? "Unpin user" : "Pin user"}
          >
            <Pin size={16} className={isPinned ? 'fill-indigo-400' : ''} />
          </button>
        )}

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
                  {onSendMessage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onSendMessage();
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white'}`}
                    >
                      <MessageSquare size={14} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white" /> 
                      <span>Send Message</span>
                    </button>
                  )}
                  {onViewProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onViewProfile();
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white'}`}
                    >
                      <User size={14} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white" /> 
                      <span>View Profile</span>
                    </button>
                  )}
                  {cameras && cameras.length > 1 && (
                    <>
                      <div className={`w-full h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      {cameras.map(camera => (
                        <button
                          key={camera.deviceId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCameraSwitch?.(camera.deviceId);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-[5px] text-[13px] font-medium rounded-[5px] group/btn ${
                            selectedCamera === camera.deviceId
                              ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                              : (isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white')
                          }`}
                        >
                          <Camera size={14} className={selectedCamera === camera.deviceId ? 'opacity-100' : 'opacity-70 group-hover/btn:opacity-100 group-hover/btn:text-white'} /> 
                          <span className="truncate max-w-[120px]">{camera.label || 'Camera'}</span>
                        </button>
                      ))}
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
