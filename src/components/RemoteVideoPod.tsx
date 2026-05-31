'use client';

import { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { getUserProfile } from '@/app/actions/user-actions';
import { calculateLevel } from '@/lib/title-calculator';
import { MoreVertical, ExternalLink, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';

// Sanitize social links
function sanitizeSocialLink(input: string, platform: 'instagram' | 'twitter' | 'github') {
  if (!input) return null;
  const cleanInput = input.trim();
  
  // If it's already a full URL, return it if it's http/https
  if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
    try {
      new URL(cleanInput);
      return cleanInput;
    } catch {
      return null;
    }
  }

  // Otherwise, assume it's a handle and format it
  const handle = cleanInput.startsWith('@') ? cleanInput.substring(1) : cleanInput;
  if (!handle) return null;

  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'twitter': return `https://x.com/${handle}`;
    case 'github': return `https://github.com/${handle}`;
    default: return null;
  }
}

interface UserProfileData {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  instagram: string | null;
  twitter: string | null;
  github: string | null;
  bannerUrl: string | null;
  currentGrind: string | null;
  programmingTools: string[];
  activeGoals: string[];
  customLinks: string[];
  xp: number;
}

export function RemoteVideoPod({ stream, handle, userId }: { stream: MediaStream | null, handle: string, userId?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStage, setMenuStage] = useState<'menu' | 'profile'>('menu');
  const [loading, setLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(true);

  // Detect whether the stream has an active video track
  useEffect(() => {
    if (!stream) { queueMicrotask(() => setIsVideoActive(false)); return; }
    const checkVideo = () => {
      const videoTracks = stream.getVideoTracks();
      queueMicrotask(() => setIsVideoActive(videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live')));
    };
    checkVideo();
    stream.addEventListener('addtrack', checkVideo);
    stream.addEventListener('removetrack', checkVideo);
    return () => {
      stream.removeEventListener('addtrack', checkVideo);
      stream.removeEventListener('removetrack', checkVideo);
    };
  }, [stream]);

  const initials = profile?.displayName
    ? profile.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : handle.slice(0, 2).toUpperCase();

  // CRITICAL FIX: Run after every render to ensure srcObject isn't lost during Framer Motion layout changes
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  });

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to menu stage when popover closes
      setTimeout(() => setMenuStage('menu'), 200);
    }
  };

  const handleViewProfile = async () => {
    setMenuStage('profile');
    if (!profile) {
      setLoading(true);
      try {
        const data = await getUserProfile(handle);
        if (data) setProfile(data as UserProfileData);
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-background border-[length:var(--border-weight)] border-border group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-200 ${!isVideoActive ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
      />

      {/* Avatar overlay when remote cam is off */}
      {!isVideoActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-high">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-20 h-20 object-cover border-[length:var(--border-weight)] border-border"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center border-[length:var(--border-weight)] border-border bg-background">
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
          @{handle}
        </span>
      </div>

      {/* 3-Dot Context Menu */}
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button className="absolute top-0 right-0 m-2 p-1.5 bg-background border-[length:var(--border-weight)] border-border text-foreground hover:bg-border active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100 outline-none shadow-[var(--ui-shadow)]">
            <MoreVertical size={16} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-surface border-[length:var(--border-weight)] border-border shadow-[var(--ui-shadow)] z-[100] overflow-hidden"
            sideOffset={5}
            align="end"
            side="top"
          >
            {menuStage === 'menu' ? (
              // Stage 1: Action menu
              <div className="w-44 flex flex-col">
                <div className="px-3 py-2 border-b border-border">
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold">@{handle}</span>
                </div>
                <button
                  onClick={() => {
                    // Dispatch event with both handle (display) and userId (DB primary key)
                    window.dispatchEvent(
                      new CustomEvent('monolith:open-dm', { detail: { handle, userId } })
                    );
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-surface-high transition-colors text-xs font-[family-name:var(--font-primary)] font-bold uppercase tracking-wider text-left"
                >
                  <MessageSquare size={14} className="text-secondary" />
                  Send Message
                </button>
                <button
                  onClick={handleViewProfile}
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-surface-high transition-colors text-xs font-[family-name:var(--font-primary)] font-bold uppercase tracking-wider text-left border-t border-border"
                >
                  <User size={14} className="text-secondary" />
                  View Profile
                </button>
              </div>
            ) : (
              // Stage 2: Profile card
              <div className="w-[260px] flex flex-col">
                {/* Back */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <button
                    onClick={() => setMenuStage('menu')}
                    className="text-[10px] uppercase tracking-widest text-secondary hover:text-foreground font-bold font-[family-name:var(--font-primary)] transition-colors"
                  >
                    ← Back
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-6 font-[family-name:var(--font-primary)] text-xs text-secondary animate-pulse">Loading...</div>
                ) : profile ? (
                  <div className="flex flex-col gap-3 p-4">

                    {/* Banner */}
                    <div className="w-full h-12 bg-surface-container border-[length:var(--border-weight)] border-border overflow-hidden relative">
                      {profile.bannerUrl ? (
                        <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 2px, transparent 2px, transparent 14px)' }} />
                      )}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" className="w-9 h-9 object-cover border-[length:var(--border-weight)] border-border" />
                      ) : (
                        <div className="w-9 h-9 bg-background border-[length:var(--border-weight)] border-border flex items-center justify-center">
                          <span className="font-[family-name:var(--font-primary)] text-xs text-secondary font-bold">{profile.handle.substring(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-[family-name:var(--font-primary)] font-black text-sm text-foreground truncate uppercase tracking-tight">{profile.displayName}</span>
                        <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">@{profile.handle}</span>
                        <div className="text-[9px] font-[family-name:var(--font-primary)] text-primary mt-0.5 tracking-widest truncate">
                          {calculateLevel(profile.xp).displayString}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    {profile.currentGrind && (
                      <div className="border-t border-border pt-3">
                        <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Status</div>
                        <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground border border-border px-2 py-1 bg-background inline-block">
                          {profile.currentGrind}
                        </p>
                      </div>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <div className="border-t border-border pt-3">
                        <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Bio</div>
                        <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground leading-relaxed line-clamp-3">
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {profile.programmingTools.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Tools</div>
                        <div className="flex flex-wrap gap-1">
                          {profile.programmingTools.slice(0, 6).map(tool => (
                            <span key={tool} className="font-[family-name:var(--font-primary)] text-[9px] uppercase tracking-wider text-secondary bg-background border border-border px-1">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Profile Link */}
                    <Link
                      href={`/profile/${profile.handle}`}
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 p-2.5 mt-1 border-[length:var(--border-weight)] border-border bg-primary text-primary-foreground font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <ExternalLink size={12} /> Full Profile
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 font-[family-name:var(--font-primary)] text-xs text-secondary">Profile not found.</div>
                )}
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

