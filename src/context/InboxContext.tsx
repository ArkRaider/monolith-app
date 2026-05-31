'use client';

/**
 * src/context/InboxContext.tsx
 *
 * Decoupled Inbox state manager.
 *
 * Separates the background socket subscription (dm:receive listener)
 * from the UI popover toggle. The provider wraps the whole app in
 * src/app/layout.tsx so the DM socket listener is always alive and
 * the unread badge updates regardless of which page the user is on.
 *
 * Consumers:
 *   - InboxWidget — reads isOpen/setIsOpen + conversations
 *   - StudioClient — calls openInbox() to trigger the overlay
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface InboxContextValue {
  isOpen: boolean;
  openInbox: () => void;
  closeInbox: () => void;
  toggleInbox: () => void;
  totalUnread: number;
  setTotalUnread: (n: number) => void;
}

const InboxContext = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen]           = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const openInbox   = useCallback(() => setIsOpen(true),  []);
  const closeInbox  = useCallback(() => setIsOpen(false), []);
  const toggleInbox = useCallback(() => setIsOpen(o => !o), []);

  return (
    <InboxContext.Provider value={{ isOpen, openInbox, closeInbox, toggleInbox, totalUnread, setTotalUnread }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox(): InboxContextValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error('useInbox must be used inside <InboxProvider>');
  return ctx;
}
