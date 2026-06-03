'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, ArrowLeft, Send, UserPlus, Check, Trash2, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import * as Popover from '@radix-ui/react-popover';
import { getUserProfile } from '@/app/actions/user-actions';
import { calculateLevel } from '@/lib/title-calculator';
import { useNotification } from '@/context/NotificationContext';
import { useInbox } from '@/context/InboxContext';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/app/actions/friend-actions';

import { InboxHeader } from './inbox/InboxHeader';
import { InboxChatsTab } from './inbox/InboxChatsTab';
import { InboxRequestsTab } from './inbox/InboxRequestsTab';
import { InboxThread } from './inbox/InboxThread';

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
export function InboxWidget({ inline }: { inline?: boolean }) {
  const { user, isLoaded } = useUser();
  const { notify } = useNotification();
  const pathname = usePathname();

  const { isOpen: open, toggleInbox, openInbox, closeInbox, setTotalUnread: setContextUnread } = useInbox();

  const isInRoom = pathname?.startsWith('/room');
  const isMinimalDashboard = pathname?.startsWith('/dashboard/minimal') || pathname?.includes('/minimal-studio');

  const { theme } = useTheme();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

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
    if ((open || inline) && activeTab === 'REQUESTS') {
      fetchRequests();
    }
  }, [open, inline, activeTab, fetchRequests]);

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
        if ((!open && !inline) || !isCurrentThread) {
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
  }, [isLoaded, user, open, inline, notify]);

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

  if (!isLoaded || !user || pathname === '/') return null;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const unreadCount = totalUnread + friendRequests.length;

  const minimalDashboardStyles = {
    '--color-surface': isDark ? 'rgba(23, 23, 23, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    '--color-surface-high': isDark ? 'rgba(38, 38, 38, 0.9)' : 'rgba(244, 244, 245, 0.9)',
    '--color-border': isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    '--color-foreground': isDark ? '#ffffff' : '#111111',
    '--color-secondary': isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    '--color-background': isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(250, 250, 250, 0.9)',
    '--color-primary': isDark ? '#ffffff' : '#000000',
    '--color-primary-foreground': isDark ? '#000000' : '#ffffff',
    '--border-weight': '1px',
    '--ui-shadow': isDark ? '0 20px 50px rgba(0,0,0,0.85)' : '0 20px 50px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px',
    color: 'var(--color-foreground)',
    background: 'var(--color-surface)',
    border: 'var(--border-weight) solid var(--color-border)',
    boxShadow: 'var(--ui-shadow)',
  } as React.CSSProperties;

  const legacyStyles = {
    background: 'var(--color-surface)',
    border: 'var(--border-weight) solid var(--color-border)',
    boxShadow: 'var(--ui-shadow)',
  } as React.CSSProperties;

  const content = (
    <div
      className={`${inline ? 'w-full h-full' : (isMinimalDashboard ? 'w-[340px] h-[500px]' : 'w-[320px] h-[440px]')} flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${!inline && isMinimalDashboard ? (open ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 translate-x-8 pointer-events-none absolute') : ''}`}
      style={inline ? { background: 'transparent' } : (isMinimalDashboard ? minimalDashboardStyles : legacyStyles)}
    >
      <InboxHeader
        inline={inline}
        activeConv={activeConv}
        setActiveConv={setActiveConv}
        setMessages={setMessages}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalUnread={totalUnread}
        friendRequestsCount={friendRequests.length}
        closeInbox={closeInbox}
      />

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
        <InboxChatsTab
          conversations={conversations}
          openConversation={openConversation}
        />
      )}

      {/* REQUESTS TAB */}
      {!activeConv && !openingDm && activeTab === 'REQUESTS' && (
        <InboxRequestsTab
          loadingRequests={loadingRequests}
          friendRequests={friendRequests}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
        />
      )}

      {/* Message Thread */}
      {activeConv && !openingDm && (
        <InboxThread
          activeConv={activeConv}
          messages={messages}
          draft={draft}
          setDraft={setDraft}
          sendMessage={sendMessage}
          sending={sending}
          messagesEndRef={messagesEndRef}
          user={user as { id: string }}
        />
      )}
        </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className={`fixed z-[200] flex flex-col items-end gap-2 transition-all duration-500 ${isMinimalDashboard ? 'right-6 top-1/2 -translate-y-1/2' : 'bottom-[4.75rem] right-4'}`}>
      {isMinimalDashboard ? content : (open && content)}

      {/* ── Floating Trigger Button ── */}
      {!isInRoom && !isMinimalDashboard && (
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
