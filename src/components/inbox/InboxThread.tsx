'use client';

import { Send, Check, CheckCheck } from 'lucide-react';

interface ConvPartner {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  delivered?: boolean;
  read?: boolean;
  sender: { id: string; handle: string; displayName: string; avatarUrl: string | null };
}

interface InboxThreadProps {
  activeConv: ConvPartner;
  messages: DMMessage[];
  draft: string;
  setDraft: (val: string) => void;
  sendMessage: () => void;
  sending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  user: { id: string };
}

export function InboxThread({
  activeConv,
  messages,
  draft,
  setDraft,
  sendMessage,
  sending,
  messagesEndRef,
  user
}: InboxThreadProps) {
  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
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
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-[family-name:var(--font-primary)]" style={{ color: 'var(--color-secondary)' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMine && (
                  <span className="flex items-center">
                    {msg.read ? (
                      <CheckCheck size={12} color="#3b82f6" />
                    ) : msg.delivered ? (
                      <CheckCheck size={12} style={{ color: 'var(--color-secondary)' }} />
                    ) : (
                      <Check size={12} style={{ color: 'var(--color-secondary)' }} />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef as any} />
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
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Message…"
          autoFocus
          className="flex-1 px-4 py-3 bg-transparent text-xs font-[family-name:var(--font-primary)] outline-none"
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
  );
}
