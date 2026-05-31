'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, ArrowLeft, Send, UserPlus, Check, Trash2, ExternalLink } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import * as Popover from '@radix-ui/react-popover';
import { getUserProfile } from '@/app/actions/user-actions';
import { calculateLevel } from '@/lib/title-calculator';
import { useNotification } from '@/context/NotificationContext';
import { useInbox } from '@/context/InboxContext';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/app/actions/friend-actions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ConvPartner {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Conversation {
  partner: ConvPartner;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; handle: string; displayName: string; avatarUrl: string | null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton socket
// ─────────────────────────────────────────────────────────────────────────────
let dmSocket: Socket | null = null;

function getDmSocket(): Socket {
  if (!dmSocket) {
    dmSocket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || 'https://monolith-signaling-server.onrender.com', {
      autoConnect: true,
    });
  }
  return dmSocket;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function InboxWidget() {
  const { user, isLoaded } = useUser();
  const { notify } = useNotification();
  const pathname = usePathname();

  const { isOpen: open, toggleInbox, openInbox, closeInbox, setTotalUnread: setContextUnread } = useInbox();

  const isInRoom = pathname?.startsWith('/room');

  // Tab State
  const [activeTab, setActiveTab] = useState<'CHATS' | 'REQUESTS'>('CHATS');

  // Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<ConvPartner | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnreadLocal] = useState(0);
  const [openingDm, setOpeningDm] = useState(false);

  // Friend Requests State
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Profile Preview State
  const [profilePreview, setProfilePreview] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const setTotalUnread = (n: number) => {
    setTotalUnreadLocal(n);
    setContextUnread(n);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<ConvPartner | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Fetch Friend Requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    const requests = await getFriendRequests();
    setFriendRequests(requests);
    setLoadingRequests(false);
  }, []);

  // Fetch requests when open or when tab changes
  useEffect(() => {
    if (open && activeTab === 'REQUESTS') {
      fetchRequests();
    }
  }, [open, activeTab, fetchRequests]);

  const handleAcceptRequest = async (id: string) => {
    await acceptFriendRequest(id);
    await fetchRequests();
    notify('Friend request accepted', 'Success');
  };

  const handleRejectRequest = async (id: string) => {
    await rejectFriendRequest(id);
    await fetchRequests();
    notify('Friend request ignored', 'Success');
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open a conversation
  const openConversation = useCallback((partner: ConvPartner) => {
    setActiveConv(partner);
    setMessages([]);
    openInbox();
    socketRef.current?.emit('dm:history', { partnerId: partner.id });
  }, [openInbox]);

  // Socket setup
  useEffect(() => {
    if (!isLoaded || !user) return;

    const socket = getDmSocket();
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('dm:initialize', { userId: user.id });
      socket.emit('dm:conversations');
    };

    if (socket.connected) {
      socket.emit('dm:initialize', { userId: user.id });
      socket.emit('dm:conversations');
    }

    const onDmReceive = (msg: DMMessage) => {
      const isIncoming = msg.senderId !== user.id;

      if (isIncoming) {
        const isCurrentThread = activeConvRef.current?.id === msg.senderId;
        if (!open || !isCurrentThread) {
          notify(`@${msg.sender?.handle ?? 'Someone'} sent you a message`, msg.sender?.handle);
        }
      }

      const partner = isIncoming ? msg.senderId : activeConvRef.current?.id;
      if (activeConvRef.current && (partner === activeConvRef.current.id || !isIncoming)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      socket.emit('dm:conversations');
    };

    const onHistoryRes = ({ partnerId, messages: msgs }: { partnerId: string; messages: DMMessage[] }) => {
      if (activeConvRef.current?.id === partnerId) {
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    };

    const onConversationsRes = (convs: Conversation[]) => {
      const list = Array.isArray(convs) ? convs : [];
      setConversations(list);
      setTotalUnread(list.reduce((sum, c) => sum + (c.unread ?? 0), 0));
    };

    socket.on('connect', onConnect);
    socket.on('dm:receive', onDmReceive);
    socket.on('dm:history:res', onHistoryRes);
    socket.on('dm:conversations:res', onConversationsRes);

    return () => {
      socket.off('connect', onConnect);
      socket.off('dm:receive', onDmReceive);
      socket.off('dm:history:res', onHistoryRes);
      socket.off('dm:conversations:res', onConversationsRes);
    };
  }, [isLoaded, user, open, notify]);

  useEffect(() => {
    if (activeConv && socketRef.current?.connected) {
      socketRef.current.emit('dm:history', { partnerId: activeConv.id });
    }
  }, [activeConv]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const { handle, userId: peerId } = (e as CustomEvent<{ handle: string; userId?: string }>).detail;
      if (!handle && !peerId) return;

      openInbox();
      setActiveTab('CHATS'); // force switch to chats

      if (peerId) {
        openConversation({
          id: peerId,
          handle: handle ?? peerId,
          displayName: handle ?? peerId,
          avatarUrl: null,
        });
        try {
          const res = await fetch(`/api/users/by-handle/${encodeURIComponent(handle ?? '')}`);
          if (res.ok) {
            const partner = await res.json();
            if (partner?.id) openConversation(partner);
          }
        } catch { /* non-critical */ }
        return;
      }

      setOpeningDm(true);
      try {
        const res = await fetch(`/api/users/by-handle/${encodeURIComponent(handle)}`);
        if (res.ok) {
          const partner = await res.json();
          if (partner?.id) openConversation(partner);
        }
      } catch (err) {
        console.error('[InboxWidget] open-dm resolution failed:', err);
      } finally {
        setOpeningDm(false);
      }
    };

    window.addEventListener('monolith:open-dm', handler);
    return () => window.removeEventListener('monolith:open-dm', handler);
  }, [openConversation, openInbox]);

  const sendMessage = useCallback(() => {
    if (!draft.trim() || !activeConv || sending || !socketRef.current?.connected) return;
    setSending(true);
    const content = draft.trim();
    setDraft('');

    socketRef.current.emit('dm:send', {
      recipientId: activeConv.id,
      content,
    });
    setSending(false);
  }, [draft, activeConv, sending]);

  if (!isLoaded || !user) return null;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const unreadCount = totalUnread + friendRequests.length;

  return (
    <div className="fixed bottom-[4.75rem] right-4 z-[200] flex flex-col items-end gap-2">
      {open && (
        <div
          className="w-[320px] h-[440px] flex flex-col overflow-hidden transition-all duration-200"
          style={{
            background: 'var(--color-surface)',
            border: 'var(--border-weight) solid var(--color-border)',
            boxShadow: 'var(--ui-shadow)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
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
                              <a
                                href={`/u/${profilePreview.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setProfilePopoverOpen(false)}
                                className="flex-1 flex items-center justify-center gap-2 p-2.5 border-[length:var(--border-weight)] border-border bg-surface text-foreground hover:bg-surface-high font-[family-name:var(--font-primary)] font-black text-[10px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
                                title="View Full Profile"
                              >
                                <ExternalLink size={12} /> View Profile
                              </a>
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
                  REQUESTS {friendRequests.length > 0 && <span className="text-[9px] font-bold text-primary ml-1">({friendRequests.length})</span>}
                </button>
              </div>
            )}
            
            <button
              onClick={() => closeInbox()}
              className="transition-colors"
              style={{ color: 'var(--color-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Resolving DM */}
          {openingDm && !activeConv && (
            <div className="flex-1 flex items-center justify-center">
              <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest animate-pulse" style={{ color: 'var(--color-secondary)' }}>
                Opening chat…
              </span>
            </div>
          )}

          {/* CHATS TAB */}
          {!activeConv && !openingDm && activeTab === 'CHATS' && (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--color-secondary)' }}>
                  <MessageSquare size={24} className="opacity-30" />
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest">No conversations yet</span>
                  <span className="font-[family-name:var(--font-primary)] text-[9px] tracking-wide opacity-60">
                    Press ⋮ on a user to start one
                  </span>
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.partner.id}
                  onClick={() => openConversation(conv.partner)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-high)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-8 h-8 shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--color-background)', border: 'var(--border-weight) solid var(--color-border)' }}
                  >
                    {conv.partner.avatarUrl
                      ? <img src={conv.partner.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="font-[family-name:var(--font-primary)] text-[10px] font-black" style={{ color: 'var(--color-foreground)' }}>{initials(conv.partner.displayName)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-[family-name:var(--font-primary)] text-[10px] font-bold uppercase" style={{ color: 'var(--color-foreground)' }}>@{conv.partner.handle}</span>
                      {conv.unread > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 font-[family-name:var(--font-primary)]" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="font-[family-name:var(--font-primary)] text-[10px] truncate mt-0.5" style={{ color: 'var(--color-secondary)' }}>{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* REQUESTS TAB */}
          {!activeConv && !openingDm && activeTab === 'REQUESTS' && (
            <div className="flex-1 overflow-y-auto">
              {loadingRequests ? (
                <div className="flex items-center justify-center h-full">
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest animate-pulse" style={{ color: 'var(--color-secondary)' }}>
                    Loading Requests...
                  </span>
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--color-secondary)' }}>
                  <UserPlus size={24} className="opacity-30" />
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest">No Pending Requests</span>
                </div>
              ) : friendRequests.map(req => (
                <div
                  key={req.id}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ background: 'var(--color-background)', border: 'var(--border-weight) solid var(--color-border)' }}
                    >
                      {req.requester.avatarUrl
                        ? <img src={req.requester.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="font-[family-name:var(--font-primary)] text-[10px] font-black" style={{ color: 'var(--color-foreground)' }}>{initials(req.requester.displayName)}</span>
                      }
                    </div>
                    <div className="flex flex-col">
                      <span className="font-[family-name:var(--font-primary)] text-[10px] font-bold uppercase" style={{ color: 'var(--color-foreground)' }}>@{req.requester.handle}</span>
                      <span className="font-[family-name:var(--font-primary)] text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-secondary)' }}>wants to connect</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAcceptRequest(req.id)} className="w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground hover:opacity-80 transition-opacity">
                      <Check size={12} />
                    </button>
                    <button onClick={() => handleRejectRequest(req.id)} className="w-6 h-6 flex items-center justify-center bg-surface-high text-secondary border border-border hover:bg-border transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Thread */}
          {activeConv && !openingDm && (
            <>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ border: 'var(--border-weight) solid var(--color-border)', background: 'var(--color-background)' }}
                    >
                      {activeConv.avatarUrl
                        ? <img src={activeConv.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="font-[family-name:var(--font-primary)] text-sm font-black" style={{ color: 'var(--color-foreground)' }}>{initials(activeConv.displayName)}</span>
                      }
                    </div>
                    <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase font-bold" style={{ color: 'var(--color-foreground)' }}>@{activeConv.handle}</span>
                    <span className="font-[family-name:var(--font-primary)] text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-secondary)' }}>Start the conversation</span>
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className="max-w-[75%] px-3 py-2 text-xs font-[family-name:var(--font-primary)]"
                        style={isMine
                          ? { background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', border: 'var(--border-weight) solid var(--color-primary)' }
                          : { background: 'var(--color-background)', color: 'var(--color-foreground)', border: 'var(--border-weight) solid var(--color-border)' }
                        }
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] font-[family-name:var(--font-primary)]" style={{ color: 'var(--color-secondary)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                className="shrink-0 flex items-center"
                style={{ borderTop: 'var(--border-weight) solid var(--color-border)', background: 'var(--color-background)' }}
              >
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Message…"
                  autoFocus
                  className="flex-1 px-4 py-3 bg-transparent text-xs font-[family-name:var(--font-primary)] outline-none uppercase"
                  style={{ color: 'var(--color-foreground)' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !draft.trim()}
                  className="px-4 py-3 transition-colors disabled:opacity-30"
                  style={{
                    color: 'var(--color-secondary)',
                    borderLeft: 'var(--border-weight) solid var(--color-border)',
                  }}
                  onMouseEnter={e => { if (!sending && draft.trim()) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-secondary)'; }}
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating Trigger Button ── */}
      {!isInRoom && (
        <button
          onClick={toggleInbox}
          className="w-9 h-9 flex items-center justify-center transition-colors relative"
          style={{
            background: 'var(--color-surface)',
            border: 'var(--border-weight) solid var(--color-border)',
            boxShadow: 'var(--ui-shadow)',
            color: 'var(--color-foreground)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary-foreground)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-foreground)';
          }}
        >
          <MessageSquare size={16} />
          {unreadCount > 0 && !open && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center font-[family-name:var(--font-primary)]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
