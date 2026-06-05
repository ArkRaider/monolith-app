'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, MessageSquare, User } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { pingActiveStatus } from '@/app/actions/user-actions';
import { getOnlineFriends } from '@/app/actions/friend-actions';

interface RecentUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  lastActive: Date;
}

export function LiveActivityPanel() {
  const [users, setUsers] = useState<RecentUser[]>([]);

  const pathname = usePathname();

  const fetchUsers = useCallback(async () => {
    try {
      const recent = await getOnlineFriends();
      setUsers(recent);
    } catch (error) {
      console.error('Failed to fetch recent users:', error);
    }
  }, []);

  const pingStatus = useCallback(async () => {
    try {
      await pingActiveStatus();
    } catch (error) {
      console.error('Failed to ping active status:', error);
    }
  }, []);

  // Ping on route changes
  useEffect(() => {
    pingStatus();
  }, [pathname, pingStatus]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchUsers();
      pingStatus();
    });

    const pingInterval = setInterval(pingStatus, 5 * 60 * 1000);
    const fetchInterval = setInterval(fetchUsers, 60 * 1000);

    const onFocus = () => { fetchUsers(); pingStatus(); };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(pingInterval);
      clearInterval(fetchInterval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUsers, pingStatus]);

  return (
    <aside className="hidden xl:flex flex-col w-[220px] border-l border-border p-6 flex-shrink-0 bg-surface/30 relative z-0">
      <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary mb-6">Online Friends</h3>

      <div className="flex flex-col gap-1">
        {users.length > 0 ? users.map((user) => (
          <ActivityRow key={user.id} user={user} />
        )) : (
          <span className="font-[family-name:var(--font-primary)] text-xs text-secondary">No active users.</span>
        )}
      </div>
    </aside>
  );
}

function ActivityRow({ user }: { user: RecentUser }) {
  const [statusStr, setStatusStr] = useState('just now');
  const [isOnline, setIsOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const updateStatus = () => {
      const diffMs = Date.now() - new Date(user.lastActive).getTime();
      const isCurrentlyOnline = diffMs < 5 * 60 * 1000;

      const newStatus = isCurrentlyOnline
        ? 'Online'
        : (() => {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            if (hours > 0) return `Active ${hours}h ${minutes}m ago`;
            if (minutes > 0) return `Active ${minutes}m ago`;
            return 'Active just now';
          })();

      if (active) {
        setIsOnline(isCurrentlyOnline);
        setStatusStr(newStatus);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user.lastActive]);

  const openDm = () => {
    window.dispatchEvent(
      new CustomEvent('monolith:open-dm', {
        detail: { handle: user.handle, userId: user.id },
      })
    );
    setMenuOpen(false);
  };

  return (
    <div className="group flex items-center gap-3 px-2 py-2.5 hover:bg-surface-high rounded-sm transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 bg-surface border border-border shrink-0 flex items-center justify-center relative">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
            {user.handle.substring(0, 2).toUpperCase()}
          </span>
        )}
        {isOnline && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border border-background" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-[family-name:var(--font-primary)] text-xs text-foreground truncate">{user.displayName}</span>
        <span className="font-[family-name:var(--font-primary)] text-[11px] text-secondary truncate">@{user.handle}</span>
        <span className="font-[family-name:var(--font-primary)] text-[10px] text-primary mt-0.5">{statusStr}</span>
      </div>

      {/* 3-dot context menu */}
      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            className="shrink-0 p-1 text-secondary hover:text-foreground hover:bg-border transition-all opacity-0 group-hover:opacity-100 outline-none"
            aria-label={`Options for ${user.handle}`}
          >
            <MoreVertical size={14} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="bg-surface border-[length:var(--border-weight)] border-border shadow-[var(--ui-shadow)] z-[300] overflow-hidden w-44"
            sideOffset={4}
            align="end"
            side="left"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border">
              <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold">
                @{user.handle}
              </span>
            </div>

            {/* Send Message */}
            <button
              onClick={openDm}
              className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:bg-surface-high transition-colors text-xs font-[family-name:var(--font-primary)] font-bold uppercase tracking-wider text-left border-b border-border"
            >
              <MessageSquare size={13} className="text-secondary" />
              Send Message
            </button>

            {/* View Profile */}
            <Link
              href={`/profile/${user.handle}`}
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:bg-surface-high transition-colors text-xs font-[family-name:var(--font-primary)] font-bold uppercase tracking-wider"
            >
              <User size={13} className="text-secondary" />
              View Profile
            </Link>

            <Popover.Arrow className="fill-border" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
