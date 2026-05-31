'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyRoomPassword } from '@/app/actions/room-actions';

interface LobbyClientProps {
  roomSlug: string;
  roomName: string;
  requiresPassword: boolean;
  allowCam: boolean;
  allowMic: boolean;
}

export default function LobbyClient({ roomSlug, roomName, requiresPassword, allowCam, allowMic }: LobbyClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [password, setPassword] = useState('');
  const [camOn, setCamOn] = useState(allowCam);
  const [micOn, setMicOn] = useState(allowMic);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function setupPreview() {
      const constraints = {
        video: allowCam ? camOn : false,
        audio: allowMic ? micOn : false
      };

      if (!constraints.video && !constraints.audio) {
        console.warn("[Lobby] Postponing stream setup: no media tracks selected or allowed yet.");
        // Clear stream if everything is off
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          setStream(null);
        }
        return;
      }

      try {
        const ms = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(ms);
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
        }
      } catch (err) {
        console.error("Failed to get media", err);
        setCamOn(false);
        setMicOn(false);
      }
    }
    setupPreview();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [camOn, micOn, allowCam, allowMic]);

  const toggleCam = () => setCamOn(prev => !prev);
  const toggleMic = () => setMicOn(prev => !prev);

  const handleJoin = () => {
    setError('');
    const url = new URL(`/room/${roomSlug}/studio`, window.location.origin);
    url.searchParams.set('cam', camOn ? '1' : '0');
    url.searchParams.set('mic', micOn ? '1' : '0');

    if (requiresPassword) {
      startTransition(async () => {
        try {
          const res = await verifyRoomPassword(roomSlug, password);
          if (res.success) {
            router.push(url.toString());
          } else {
            setError(res.error || 'Invalid password');
          }
        } catch (err) {
          setError('Failed to verify password');
        }
      });
    } else {
      router.push(url.toString());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-2xl bg-surface border border-border p-8 flex flex-col gap-8">
        
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-primary)] font-bold text-3xl uppercase tracking-tight text-foreground">{roomName}</h1>
          <p className="font-[family-name:var(--font-primary)] text-xs text-secondary mt-2">LOBBY / HARDWARE CHECK</p>
        </div>

        <div className="relative aspect-video bg-surface-high border border-border flex items-center justify-center overflow-hidden">
          {camOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="font-[family-name:var(--font-primary)] text-sm text-secondary">CAMERA OFF</span>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
            <div className="relative group">
              <button 
                onClick={toggleMic}
                disabled={!allowMic}
                className={`p-3 border transition-colors ${micOn ? 'bg-foreground text-background border-foreground' : 'bg-surface text-secondary border-border'} disabled:opacity-50`}
              >
                {micOn ? 'MIC ON' : 'MIC OFF'}
              </button>
              {!allowMic && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max bg-foreground text-background text-[10px] px-2 py-1 font-[family-name:var(--font-primary)] uppercase">
                  Microphones disabled by Room Admin
                </div>
              )}
            </div>
            
            <div className="relative group">
              <button 
                onClick={toggleCam}
                disabled={!allowCam}
                className={`p-3 border transition-colors ${camOn ? 'bg-foreground text-background border-foreground' : 'bg-surface text-secondary border-border'} disabled:opacity-50`}
              >
                {camOn ? 'CAM ON' : 'CAM OFF'}
              </button>
              {!allowCam && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max bg-foreground text-background text-[10px] px-2 py-1 font-[family-name:var(--font-primary)] uppercase">
                  Cameras disabled by Room Admin
                </div>
              )}
            </div>
          </div>
        </div>

        {requiresPassword && (
          <div className="flex flex-col gap-2 w-full">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase text-secondary">Room Password Required</label>
            <input 
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-background border border-border p-3 text-foreground font-[family-name:var(--font-primary)] focus:border-primary outline-none transition-colors"
              placeholder="ENTER PASSWORD"
            />
            {error && <span className="text-red-500 font-[family-name:var(--font-primary)] text-xs">{error}</span>}
          </div>
        )}

        <button 
          onClick={handleJoin}
          disabled={(requiresPassword && !password) || isPending}
          className="w-full bg-foreground text-background font-[family-name:var(--font-primary)] font-bold text-sm tracking-widest uppercase py-4 hover:bg-primary hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isPending ? 'VERIFYING...' : 'Join Room'}
        </button>

      </div>
    </div>
  );
}
