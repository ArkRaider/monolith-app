'use client';

import { MessageSquare } from 'lucide-react';

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

interface InboxChatsTabProps {
  conversations: Conversation[];
  openConversation: (partner: ConvPartner) => void;
}

export function InboxChatsTab({ conversations, openConversation }: InboxChatsTabProps) {
  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
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
  );
}
