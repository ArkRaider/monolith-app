'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationsContextValue {
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openNotifications = useCallback(() => setIsOpen(true), []);
  const closeNotifications = useCallback(() => setIsOpen(false), []);
  const toggleNotifications = useCallback(() => setIsOpen(o => !o), []);

  return (
    <NotificationsContext.Provider value={{ isOpen, openNotifications, closeNotifications, toggleNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}
