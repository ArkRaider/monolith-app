'use client';

import { UserPlus, Check, Trash2 } from 'lucide-react';

interface InboxRequestsTabProps {
  loadingRequests: boolean;
  friendRequests: any[];
  handleAcceptRequest: (id: string) => void;
  handleRejectRequest: (id: string) => void;
}

export function InboxRequestsTab({
  loadingRequests,
  friendRequests,
  handleAcceptRequest,
  handleRejectRequest
}: InboxRequestsTabProps) {
  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
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
  );
}
