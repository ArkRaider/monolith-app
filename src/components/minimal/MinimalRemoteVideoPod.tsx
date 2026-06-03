import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Shield, LogOut, Edit3, Heart, VideoOff } from 'lucide-react';
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
}

export function MinimalRemoteVideoPod({
  peerId,
  stream,
  handle,
  userId,
  isAdmin,
  onKick,
  isDark,
  status
}: MinimalRemoteVideoPodProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isAudioMuted;
    }
  }, [volume, isAudioMuted]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-[32px] border group transition-all duration-300 ${isDark ? 'border-white/10 bg-[#181a20]/80 shadow-2xl backdrop-blur-xl' : 'border-black/10 bg-white/80 shadow-xl backdrop-blur-xl'}`}>
      
      {/* Top action buttons (Admin kick, volume) */}
      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setVolume(v => v === 0 ? 1 : 0)}
          className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur"
        >
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {isAdmin && (
          <button 
            onClick={onKick}
            className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 backdrop-blur"
            title="Kick user"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>



      {/* Video or Avatar */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        className={`w-full h-full object-contain aspect-video bg-black/5 block transition-opacity duration-300 ${!stream || stream.getVideoTracks().length === 0 ? 'hidden' : 'block'}`}
      />
      
      {(!stream || stream.getVideoTracks().length === 0) && (
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
      {!isAudioMuted && stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled && (
         <div className="absolute bottom-16 right-4 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse z-30" />
      )}

      {/* Bottom Bar: Name and Status */}
      <div className={`absolute bottom-0 left-0 right-0 h-14 z-20 flex items-center px-5 justify-between backdrop-blur-xl ${isDark ? 'bg-black/40 border-t border-white/10 text-white' : 'bg-white/50 border-t border-black/10 text-black'}`}>
        <div className="flex items-center gap-2 truncate">
          <span className="text-sm font-medium text-shadow-sm truncate">{handle}</span>
          {isAdmin && <Shield size={12} className="text-indigo-400 flex-shrink-0" />}
        </div>
        
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
