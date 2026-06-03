'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Minimize2, Maximize2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocalVideoPodProps {
  stream: MediaStream | null;
  state: 'grid' | 'minimized' | 'hidden';
  onStateChange: (state: 'grid' | 'minimized' | 'hidden') => void;
  isVideoOff: boolean;
  displayName?: string;
  avatarUrl?: string | null;
}

export function LocalVideoPod({ stream, state, onStateChange, isVideoOff, displayName, avatarUrl }: LocalVideoPodProps) {
  // isMounted guard — prevents any dynamic text from differing between
  // the SSR render (empty string) and the client hydration pass (real name).
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Derive initials only on the client to stay in sync with isMounted.
  const initials = isMounted && displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '';
  const videoRef = useRef<HTMLVideoElement>(null);

  // CRITICAL FIX: Run after every render to ensure srcObject isn't lost during Framer Motion layout changes
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  });


  if (state === 'hidden') return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black border border-border rounded-[2rem] group flex items-center justify-center">
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className={`w-full h-full object-contain transition-opacity duration-200 ${isVideoOff ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
      />

      {/* Avatar overlay when camera is off */}
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-high">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || 'You'}
              className="w-20 h-20 object-cover border-[length:var(--border-weight)] border-border"
            />
          ) : (
            <div
              className="w-20 h-20 flex items-center justify-center border-[length:var(--border-weight)] border-border bg-background"
            >
              <span className="font-[family-name:var(--font-primary)] text-2xl font-black tracking-widest text-foreground">
                {initials}
              </span>
            </div>
          )}
        </div>
      )}




      {/* Name label — gradient scrim */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-2 left-2 px-2 py-0.5 z-20 pointer-events-none">
        <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-wider text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {isMounted ? `@${displayName?.split(' ')[0]?.toLowerCase() ?? 'you'}` : ''}
        </span>
      </div>
    </div>
  );
}
