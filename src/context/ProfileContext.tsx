'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProfileContextValue {
  isOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  toggleProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openProfile = useCallback(() => setIsOpen(true), []);
  const closeProfile = useCallback(() => setIsOpen(false), []);
  const toggleProfile = useCallback(() => setIsOpen(o => !o), []);

  return (
    <ProfileContext.Provider value={{ isOpen, openProfile, closeProfile, toggleProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}
