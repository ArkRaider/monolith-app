'use client';

import * as Popover from '@radix-ui/react-popover';
import { calculateLevel } from '@/lib/title-calculator';
import { MoreVertical, ExternalLink, MessageSquare, User, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface UserProfileData {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  bannerUrl: string | null;
  currentGrind: string | null;
  programmingTools: string[];
  xp: number;
}

interface PodOverlayProps {
  isVideoActive: boolean;
  profile: UserProfileData | null;
  initials: string;
  handle: string;
  userId?: string;
  isOpen: boolean;
  handleOpenChange: (open: boolean) => void;
  menuStage: 'menu' | 'profile';
  setMenuStage: (stage: 'menu' | 'profile') => void;
  loading: boolean;
  bannerError: boolean;
  setBannerError: (val: boolean) => void;
  handleViewProfile: () => void;
  handleAddFriend: () => void;
  friendshipStatus: string;
  isAdmin?: boolean;
  onKick?: () => void;
}

export function PodOverlay({
  isVideoActive,
  profile,
  initials,
  handle,
  userId,
  isOpen,
  handleOpenChange,
  menuStage,
  setMenuStage,
  loading,
  bannerError,
  setBannerError,
  handleViewProfile,
  handleAddFriend,
  friendshipStatus,
  isAdmin,
  onKick
}: PodOverlayProps) {
  return (
    <>
      {/* Avatar overlay when remote cam is off */}
      {!isVideoActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-high z-10">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-20 h-20 object-cover border-[length:var(--border-weight)] border-border shadow-[var(--ui-shadow)]"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center border-[length:var(--border-weight)] border-border bg-background shadow-[var(--ui-shadow)]">
              <span className="font-[family-name:var(--font-primary)] text-2xl font-black tracking-widest text-foreground">
                {initials}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Name label — gradient scrim */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2">
        <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10 shadow-sm">
          <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-white font-bold drop-shadow-sm">
            @{handle}
          </span>
        </div>
      </div>

      {/* 3-Dot Context Menu */}
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 active:scale-95 transition-all z-20 opacity-0 group-hover:opacity-100 outline-none rounded shadow-sm">
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
              <div className="w-44 flex flex-col">
                <div className="px-3 py-2 border-b border-border">
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold">@{handle}</span>
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('monolith:open-dm', { detail: { handle, userId } })
                    );
                    handleOpenChange(false);
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
                {isAdmin && onKick && (
                  <button
                    onClick={() => {
                      onKick();
                      handleOpenChange(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-[family-name:var(--font-primary)] font-bold uppercase tracking-wider text-left border-t border-border"
                  >
                    <ShieldAlert size={14} />
                    Kick User
                  </button>
                )}
              </div>
            ) : (
              <div className="w-[260px] flex flex-col">
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
                    <div className="w-full h-12 bg-surface-container border-[length:var(--border-weight)] border-border overflow-hidden relative">
                      {profile.bannerUrl && !bannerError ? (
                        <img src={profile.bannerUrl} alt="Banner" onError={() => setBannerError(true)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 2px, transparent 2px, transparent 14px)' }} />
                      )}
                    </div>
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
                    {profile.currentGrind && (
                      <div className="border-t border-border pt-3">
                        <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Status</div>
                        <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground border border-border px-2 py-1 bg-background inline-block">
                          {profile.currentGrind}
                        </p>
                      </div>
                    )}
                    {profile.bio && (
                      <div className="border-t border-border pt-3">
                        <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Bio</div>
                        <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground leading-relaxed line-clamp-3">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                    {profile.programmingTools && profile.programmingTools.length > 0 && (
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
                    <div className="flex gap-2 mt-1">
                      {friendshipStatus === 'NONE' && (
                        <button onClick={handleAddFriend} className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-primary text-primary-foreground font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all">
                          Add Friend
                        </button>
                      )}
                      {friendshipStatus === 'PENDING_SENT' && (
                        <button disabled className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-transparent text-secondary font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase cursor-not-allowed">
                          Sent
                        </button>
                      )}
                      {friendshipStatus === 'PENDING_RECEIVED' && (
                        <button disabled className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-transparent text-secondary font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase cursor-not-allowed">
                          Check Inbox
                        </button>
                      )}
                      {friendshipStatus === 'ACCEPTED' && (
                        <button disabled className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-transparent text-primary font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase cursor-not-allowed">
                          Friends ✓
                        </button>
                      )}
                      <Link
                        href={`/u/${profile.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleOpenChange(false)}
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-surface text-foreground hover:bg-surface-high font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
                        title="View Full Profile"
                      >
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 font-[family-name:var(--font-primary)] text-xs text-secondary">Profile not found.</div>
                )}
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
