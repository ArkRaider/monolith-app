'use client';

import { useEffect, useRef, useState } from 'react';
import { getUserProfile } from '@/app/actions/user-actions';
import { PodOverlay } from '@/components/room/video/PodOverlay';
import { PodGlassFrame } from '@/components/room/video/PodGlassFrame';

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

export function RemoteVideoPod({ stream, handle, userId, isAdmin, onKick }: { stream: MediaStream | null, handle: string, userId?: string, isAdmin?: boolean, onKick?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStage, setMenuStage] = useState<'menu' | 'profile'>('menu');
  const [loading, setLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState('NONE');
  const [bannerError, setBannerError] = useState(false);

  const trackCount = stream?.getTracks().length || 0;

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
  }, [stream, trackCount]);

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
      setBannerError(false);
      try {
        const data = await getUserProfile(handle);
        if (data && !('error' in data)) {
          setProfile(data as UserProfileData);
          const { getFriendshipStatus } = await import('@/app/actions/friend-actions');
          const status = await getFriendshipStatus(data.id);
          setFriendshipStatus(status);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddFriend = async () => {
    if (!profile || friendshipStatus !== 'NONE') return;
    setFriendshipStatus('PENDING_SENT');
    const { sendFriendRequest } = await import('@/app/actions/friend-actions');
    const res = await sendFriendRequest(profile.id);
    if (res.error) setFriendshipStatus('NONE');
  };
  
  return (
    <PodGlassFrame>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain transition-opacity duration-200 z-10 relative ${!isVideoActive ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
      />

      <PodOverlay
        isVideoActive={isVideoActive}
        profile={profile}
        initials={initials}
        handle={handle}
        userId={userId}
        isOpen={isOpen}
        handleOpenChange={handleOpenChange}
        menuStage={menuStage}
        setMenuStage={setMenuStage}
        loading={loading}
        bannerError={bannerError}
        setBannerError={setBannerError}
        handleViewProfile={handleViewProfile}
        handleAddFriend={handleAddFriend}
        friendshipStatus={friendshipStatus}
        isAdmin={isAdmin}
        onKick={onKick}
      />
    </PodGlassFrame>
  );
}

