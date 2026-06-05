'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
import { getUserProfile } from '@/app/actions/user-actions';
import { calculateLevel } from '@/lib/title-calculator';
import Link from 'next/link';

interface ConvPartner {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

interface InboxHeaderProps {
  inline?: boolean;
  activeConv: ConvPartner | null;
  setActiveConv: (val: ConvPartner | null) => void;
  setMessages: (msgs: any[]) => void;
  activeTab: 'CHATS' | 'REQUESTS';
  setActiveTab: (tab: 'CHATS' | 'REQUESTS') => void;
  totalUnread: number;
  friendRequestsCount: number;
  closeInbox: () => void;
}

export function InboxHeader({
  inline,
  activeConv,
  setActiveConv,
  setMessages,
  activeTab,
  setActiveTab,
  totalUnread,
  friendRequestsCount,
  closeInbox
}: InboxHeaderProps) {
  const [profilePreview, setProfilePreview] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={inline ? {
        borderBottom: 'none',
      } : {
        background: 'var(--color-surface-high)',
        borderBottom: 'var(--border-weight) solid var(--color-border)',
      }}
    >
      {activeConv ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveConv(null); setMessages([]); setProfilePopoverOpen(false); }}
            className="flex items-center gap-2 transition-colors"
            style={{ color: 'var(--color-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
          >
            <ArrowLeft size={14} />
          </button>
          
          <Popover.Root open={profilePopoverOpen} onOpenChange={async (open) => {
            setProfilePopoverOpen(open);
            if (open && (!profilePreview || profilePreview.id !== activeConv.id)) {
              setLoadingProfile(true);
              setBannerError(false);
              try {
                const data = await getUserProfile(activeConv.handle);
                setProfilePreview(data);
              } catch (e) {
                console.error(e);
              } finally {
                setLoadingProfile(false);
              }
            }
          }}>
            <Popover.Trigger asChild>
              <button className="flex items-center gap-2 text-left group">
                <div className="w-6 h-6 bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {activeConv.avatarUrl ? (
                    <img src={activeConv.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-[family-name:var(--font-primary)] text-[8px] font-black text-foreground uppercase">{initials(activeConv.displayName)}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-[family-name:var(--font-primary)] text-[10px] font-bold text-foreground uppercase tracking-wider group-hover:text-primary transition-colors truncate">{activeConv.displayName}</span>
                </div>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-surface border-[length:var(--border-weight)] border-border shadow-[var(--ui-shadow)] z-[300] overflow-hidden"
                sideOffset={10}
                align="start"
                side="bottom"
              >
                <div className="w-[260px] flex flex-col">
                  {loadingProfile ? (
                    <div className="text-center py-6 font-[family-name:var(--font-primary)] text-xs text-secondary animate-pulse">Loading...</div>
                  ) : profilePreview ? (
                    <div className="flex flex-col gap-3 p-4">
                      {/* Banner */}
                      <div className="w-full h-12 bg-surface-container border-[length:var(--border-weight)] border-border overflow-hidden relative">
                        {profilePreview.bannerUrl && !bannerError ? (
                          <img src={profilePreview.bannerUrl} alt="Banner" onError={() => setBannerError(true)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 2px, transparent 2px, transparent 14px)' }} />
                        )}
                      </div>

                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3">
                        {profilePreview.avatarUrl ? (
                          <img src={profilePreview.avatarUrl} alt="Avatar" className="w-9 h-9 object-cover border-[length:var(--border-weight)] border-border" />
                        ) : (
                          <div className="w-9 h-9 bg-background border-[length:var(--border-weight)] border-border flex items-center justify-center">
                            <span className="font-[family-name:var(--font-primary)] text-xs text-secondary font-bold">{profilePreview.handle.substring(0, 2).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-[family-name:var(--font-primary)] font-black text-sm text-foreground truncate uppercase tracking-tight">{profilePreview.displayName}</span>
                          <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">@{profilePreview.handle}</span>
                          <div className="text-[9px] font-[family-name:var(--font-primary)] text-primary mt-0.5 tracking-widest truncate">
                            {calculateLevel(profilePreview.xp).displayString}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      {profilePreview.currentGrind && (
                        <div className="border-t border-border pt-3">
                          <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Status</div>
                          <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground border border-border px-2 py-1 bg-background inline-block">
                            {profilePreview.currentGrind}
                          </p>
                        </div>
                      )}

                      {/* Bio */}
                      {profilePreview.bio && (
                        <div className="border-t border-border pt-3">
                          <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Bio</div>
                          <p className="font-[family-name:var(--font-primary)] text-[10px] text-foreground leading-relaxed line-clamp-3">
                            {profilePreview.bio}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-1">
                        <Link
                          href={`/profile/${profilePreview.handle}`}
                          onClick={() => setProfilePopoverOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-surface text-foreground hover:bg-surface-high font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
                          title="View Full Profile"
                        >
                          <ExternalLink size={12} /> View Profile
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 font-[family-name:var(--font-primary)] text-xs text-secondary">Profile not found.</div>
                  )}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('CHATS')}
            className={`font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest transition-colors ${activeTab === 'CHATS' ? 'text-foreground' : 'text-secondary'}`}
          >
            CHATS {totalUnread > 0 && <span className="text-[9px] font-bold text-primary ml-1">({totalUnread})</span>}
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest transition-colors ${activeTab === 'REQUESTS' ? 'text-foreground' : 'text-secondary'}`}
          >
            REQUESTS {friendRequestsCount > 0 && <span className="text-[9px] font-bold text-primary ml-1">({friendRequestsCount})</span>}
          </button>
        </div>
      )}
      
      {!inline && (
        <button
          onClick={() => closeInbox()}
          className="transition-colors"
          style={{ color: 'var(--color-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
