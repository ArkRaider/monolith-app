'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, ArrowLeft, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useNotification } from '@/context/NotificationContext';
import { useInbox } from '@/context/InboxContext';

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
// Singleton socket — shared with the rest of the app (same origin as the
// signaling server; DashboardClient already connects to port 3001)
// ─────────────────────────────────────────────────────────────────────────────
let dmSocket: Socket | null = null;

function getDmSocket(): Socket {
  if (!dmSocket) {
    dmSocket = io('http://127.0.0.1:3001', {
      transports: ['websocket'],
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
  const { notify }         = useNotification();
  const pathname           = usePathname();

  // ── Global open/close from InboxContext ────────────────────────────────────
  // This allows StudioClient to call openInbox() from the control bar
  // without mounting a second copy of this component.
  const { isOpen: open, toggleInbox: setOpenToggle, closeInbox, setTotalUnread: setContextUnread } = useInbox();
  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    if (typeof val === 'function') {
      setOpenToggle(); // toggle
    } else {
      val ? setOpenToggle() : closeInbox();
    }
  };

  // ── Suppress the floating trigger button inside rooms ─────────────────────
  // The panel overlay still works (opened via StudioClient's control bar).
  const isInRoom = pathname?.startsWith('/room');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv]       = useState<ConvPartner | null>(null);
  const [messages, setMessages]           = useState<DMMessage[]>([]);
  const [draft, setDraft]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [totalUnread, setTotalUnreadLocal] = useState(0);
  const [openingDm, setOpeningDm]         = useState(false);

  const setTotalUnread = (n: number) => {
    setTotalUnreadLocal(n);
    setContextUnread(n); // keep context badge in sync for studio trigger
  };

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const activeConvRef   = useRef<ConvPartner | null>(null);
  const socketRef       = useRef<Socket | null>(null);

  // Keep ref in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open a conversation ────────────────────────────────────────────────────
  const openConversation = useCallback((partner: ConvPartner) => {
    setActiveConv(partner);
    setMessages([]);
    setOpen(true);
    // Request message history from server
    socketRef.current?.emit('dm:history', { partnerId: partner.id });
  }, []);

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !user) return;

    const socket = getDmSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[InboxWidget] 🔗 Socket connected, registering userId:', user.id);
      socket.emit('dm:initialize', { userId: user.id });
      socket.emit('dm:conversations'); // load initial conversation list
    };

    // Register immediately if already connected
    if (socket.connected) {
      socket.emit('dm:initialize', { userId: user.id });
      socket.emit('dm:conversations');
    }

    // ── dm:receive — incoming real-time message ──────────────────────────────
    const onDmReceive = (msg: DMMessage) => {
      const isIncoming = msg.senderId !== user.id;

      // Fire toast for incoming messages when widget is closed or different thread is active
      if (isIncoming) {
        const isCurrentThread = activeConvRef.current?.id === msg.senderId;
        if (!open || !isCurrentThread) {
          notify(
            `@${msg.sender?.handle ?? 'Someone'} sent you a message`,
            msg.sender?.handle
          );
        }
      }

      // Append to active thread if this message belongs to the open conversation
      const partner = isIncoming ? msg.senderId : activeConvRef.current?.id;
      if (activeConvRef.current && (partner === activeConvRef.current.id || !isIncoming)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Refresh conversation list to update last-message preview + unread badge
      socket.emit('dm:conversations');
    };

    // ── dm:history:res — message thread loaded ───────────────────────────────
    const onHistoryRes = ({ partnerId, messages: msgs }: { partnerId: string; messages: DMMessage[] }) => {
      if (activeConvRef.current?.id === partnerId) {
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    };

    // ── dm:conversations:res — conversation list loaded ──────────────────────
    const onConversationsRes = (convs: Conversation[]) => {
      const list = Array.isArray(convs) ? convs : [];
      setConversations(list);
      setTotalUnread(list.reduce((sum, c) => sum + (c.unread ?? 0), 0));
    };

    socket.on('connect',              onConnect);
    socket.on('dm:receive',           onDmReceive);
    socket.on('dm:history:res',       onHistoryRes);
    socket.on('dm:conversations:res', onConversationsRes);

    return () => {
      socket.off('connect',              onConnect);
      socket.off('dm:receive',           onDmReceive);
      socket.off('dm:history:res',       onHistoryRes);
      socket.off('dm:conversations:res', onConversationsRes);
    };
  }, [isLoaded, user]);

  // ── Re-request history when active conversation changes ───────────────────
  useEffect(() => {
    if (activeConv && socketRef.current?.connected) {
      socketRef.current.emit('dm:history', { partnerId: activeConv.id });
    }
  }, [activeConv]);

  // ── Global monolith:open-dm event (from video pod / activity panel) ────────
  useEffect(() => {
    const handler = async (e: Event) => {
      const { handle, userId: peerId } = (e as CustomEvent<{ handle: string; userId?: string }>).detail;
      if (!handle && !peerId) return;

      setOpen(true);

      if (peerId) {
        // Fast path — we have the DB id directly
        openConversation({
          id:          peerId,
          handle:      handle ?? peerId,
          displayName: handle ?? peerId,
          avatarUrl:   null,
        });
        // Fetch richer profile data in background
        try {
          const res = await fetch(`/api/users/by-handle/${encodeURIComponent(handle ?? '')}`);
          if (res.ok) {
            const partner = await res.json();
            if (partner?.id) openConversation(partner);
          }
        } catch { /* non-critical */ }
        return;
      }

      // Slow path — resolve handle → id
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
  }, [openConversation]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!draft.trim() || !activeConv || sending || !socketRef.current?.connected) return;
    setSending(true);
    const content = draft.trim();
    setDraft('');

    socketRef.current.emit('dm:send', {
      recipientId: activeConv.id,
      content,
    });
    // Server will echo dm:receive back — no optimistic needed, sub-100ms round-trip
    setSending(false);
  }, [draft, activeConv, sending]);

  if (!isLoaded || !user) return null;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-[4.75rem] right-4 z-[200] flex flex-col items-end gap-2">

      {/* ── Inbox Panel overlay — visible on ALL routes when open ── */}
      {open && (
        <div
          className="w-[320px] h-[440px] flex flex-col overflow-hidden"
          style={{
            background:   'var(--color-surface)',
            border:       'var(--border-weight) solid var(--color-border)',
            boxShadow:    'var(--ui-shadow)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background:  'var(--color-surface-high)',
              borderBottom: 'var(--border-weight) solid var(--color-border)',
            }}
          >
            {activeConv ? (
              <button
                onClick={() => { setActiveConv(null); setMessages([]); }}
                className="flex items-center gap-2 transition-colors"
                style={{ color: 'var(--color-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              >
                <ArrowLeft size={14} />
                <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase font-bold tracking-widest">BACK</span>
              </button>
            ) : (
              <span className="font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest" style={{ color: 'var(--color-foreground)' }}>
                INBOX
              </span>
            )}
            {activeConv && (
              <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--color-primary)' }}>
                @{activeConv.handle}
              </span>
            )}
            <button
              onClick={() => setOpen(false)}
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

          {/* Conversation List */}
          {!activeConv && !openingDm && (
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
                  {/* Avatar */}
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
                    color:       'var(--color-secondary)',
                    borderLeft:  'var(--border-weight) solid var(--color-border)',
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

      {/* ── Floating Trigger Button — hidden inside rooms ── */}
      {!isInRoom && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-9 h-9 flex items-center justify-center transition-colors relative"
          style={{
            background: 'var(--color-surface)',
            border:     'var(--border-weight) solid var(--color-border)',
            boxShadow:  'var(--ui-shadow)',
            color:      'var(--color-foreground)',
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
          {totalUnread > 0 && !open && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center font-[family-name:var(--font-primary)]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              {totalUnread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
