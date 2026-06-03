'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyRoomPassword } from '@/app/actions/room-actions';
import { useTheme } from 'next-themes';
import InteractiveCanvas from '@/components/minimal/InteractiveCanvas';
interface LobbyClientProps {
  roomSlug: string;
  roomName: string;
  requiresPassword: boolean;
  allowCam: boolean;
  allowMic: boolean;
}

export default function MinimalLobbyClient({ roomSlug, roomName, requiresPassword, allowCam, allowMic }: LobbyClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);
  
  const [password, setPassword] = useState('');
  const [camOn, setCamOn] = useState(allowCam);
  const [micOn, setMicOn] = useState(allowMic);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
    } catch (err) {
      console.error("Failed to enumerate devices", err);
    }
  };

  useEffect(() => {
    async function setupPreview() {
      const constraints: MediaStreamConstraints = {
        video: allowCam ? (camOn ? (selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true) : false) : false,
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
        
        // After getting media, update the device list so labels are available
        await getDevices();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn, micOn, allowCam, allowMic, selectedDeviceId]);

  const toggleCam = () => setCamOn(prev => !prev);
  const toggleMic = () => setMicOn(prev => !prev);

  const handleJoin = () => {
    setError('');
    const url = new URL(`/room/${roomSlug}/minimal-studio`, window.location.origin);
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

  if (!mounted) return null;

  return (
    <div className={`flex w-full min-h-screen overflow-hidden font-[family-name:var(--font-primary)] transition-colors duration-700 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'}`}>
      <InteractiveCanvas theme={theme as any} />
      
      {/* Left Column: Typography & Info */}
      <div className="flex-1 flex flex-col justify-center p-12 lg:p-24 relative z-10 border-r border-black/5 dark:border-white/5">
        <div className="max-w-2xl">
          <h1 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
            {roomName}
          </h1>
          <p className="text-sm font-mono tracking-[0.3em] opacity-40 uppercase mb-16">
            Initialization Sequence
          </p>
        </div>

        <div className="max-w-md">
          {requiresPassword && (
            <div className="flex flex-col gap-4 mb-12">
              <label className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-60">Security Clearance Required</label>
              <input 
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className={`w-full bg-transparent border-b-2 p-3 text-lg font-mono outline-none transition-colors ${
                  error ? 'border-red-500 text-red-500' : (isDark ? 'border-white/20 focus:border-white' : 'border-black/20 focus:border-black')
                }`}
                placeholder="ENTER KEY"
              />
              {error && <span className="text-red-500 font-mono text-[10px] uppercase tracking-wider">{error}</span>}
            </div>
          )}

          <button 
            onClick={handleJoin}
            disabled={(requiresPassword && !password) || isPending}
            className={`w-full group relative overflow-hidden font-mono text-sm tracking-[0.2em] uppercase py-5 transition-all duration-500 rounded-2xl disabled:opacity-30 ${
              isDark 
                ? 'bg-white text-black hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                : 'bg-black text-white hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(0,0,0,0.2)]'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isPending ? 'Authenticating...' : 'Initialize Connection'}
              {!isPending && <span className="text-[10px]">▶</span>}
            </span>
            <div className={`absolute inset-0 w-full h-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left ${
              isDark ? 'bg-neutral-300' : 'bg-neutral-700'
            }`} />
          </button>
        </div>
      </div>

      {/* Right Column: Hardware Preview */}
      <div className="flex-1 p-6 lg:p-12 relative z-10 flex items-center justify-center">
        <div className={`w-full max-w-2xl aspect-video relative overflow-hidden backdrop-blur-3xl rounded-[2rem] border transition-all duration-700 ${
          isDark 
            ? 'bg-white/[0.02] border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.15)]' 
            : 'bg-black/[0.02] border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.25)]'
        }`}>
          {camOn && cameras.length > 0 && (
            <div className="absolute top-4 right-4 z-30 group">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className={`appearance-none bg-black/40 text-white/90 text-xs font-mono pl-4 pr-10 py-2 rounded-full border border-white/10 outline-none backdrop-blur-md cursor-pointer hover:bg-black/60 hover:border-white/30 transition-all duration-300 max-w-[200px] truncate`}
              >
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId} className="bg-neutral-900 text-white">
                    {cam.label || `Camera ${cam.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}

          {camOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${stream ? 'opacity-100' : 'opacity-0'} grayscale contrast-125 brightness-110`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className={`w-16 h-16 rounded-full border border-dashed flex items-center justify-center ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
              </div>
              <span className="font-mono text-xs tracking-widest opacity-30 uppercase">
                Hardware Offline
              </span>
            </div>
          )}

          {/* Glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          {/* Controls */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-full backdrop-blur-xl border shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 z-20 hover:shadow-3xl
            ${isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'}
          `}>
            <button 
              onClick={toggleMic}
              disabled={!allowMic}
              className={`w-12 h-12 !rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-20 ${
                micOn 
                  ? (isDark ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black text-white shadow-[0_0_20px_rgba(0,0,0,0.4)]')
                  : (isDark ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-white/60 text-black hover:bg-white/80')
              }`}
            >
              {micOn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.42 10.42a3 3 0 003.16 3.16M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 01.37-1.44" /></svg>
              )}
            </button>

            <button 
              onClick={toggleCam}
              disabled={!allowCam}
              className={`w-12 h-12 !rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-20 ${
                camOn 
                  ? (isDark ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black text-white shadow-[0_0_20px_rgba(0,0,0,0.4)]')
                  : (isDark ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-white/60 text-black hover:bg-white/80')
              }`}
            >
              {camOn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

