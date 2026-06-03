import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2, VideoOff, Edit3 } from 'lucide-react';
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
}

export function MinimalLocalVideoPod({ stream, state, onStateChange, isVideoOff, displayName, avatarUrl, isDark, status, cameras = [], selectedCamera, onCameraSwitch }: MinimalLocalVideoPodProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (state === 'hidden') return null;

  const isMin = state === 'minimized';

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-[32px] border group transition-all duration-300 ${isDark ? 'border-white/10 bg-[#181a20]/80 shadow-2xl backdrop-blur-xl' : 'border-black/10 bg-white/80 shadow-xl backdrop-blur-xl'}`}>




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
      <div className={`absolute bottom-0 left-0 right-0 h-14 z-20 flex items-center px-5 justify-between backdrop-blur-xl ${isDark ? 'bg-black/40 border-t border-white/10 text-white' : 'bg-white/50 border-t border-black/10 text-black'}`}>
        <span className="text-sm font-medium text-shadow-sm truncate">{displayName} (You)</span>
        
        {/* Status Pill */}
        {status ? (
          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium max-w-[150px] truncate backdrop-blur-md ${isDark ? 'bg-indigo-500/30 text-indigo-100 border border-indigo-400/20' : 'bg-indigo-500/20 text-indigo-900 border border-indigo-500/20'}`}>
            {status}
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-xs font-medium opacity-60`}>
            <Edit3 size={12} /> No status
          </div>
        )}
      </div>
    </div>
  );
}
