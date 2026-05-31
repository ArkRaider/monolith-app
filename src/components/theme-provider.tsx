'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export type LayoutPreference = 'structural-brutalist' | 'cyber-glow' | 'retro-pixel' | 'cozy-studio';

interface LayoutContextType {
  layout: LayoutPreference;
  setLayout: (layout: LayoutPreference) => void;
}

const LayoutContext = React.createContext<LayoutContextType>({
  layout: 'structural-brutalist',
  setLayout: () => {},
});

export function useLayout() {
  return React.useContext(LayoutContext);
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [layout, setLayoutState] = React.useState<LayoutPreference>('structural-brutalist');

  React.useEffect(() => {
    const savedLayout = localStorage.getItem('layoutPreference') as LayoutPreference;
    if (savedLayout) {
      document.documentElement.dataset.layout = savedLayout;
    } else {
      document.documentElement.dataset.layout = 'structural-brutalist';
    }
    // Use rAF to avoid sync setState in effect
    const id = requestAnimationFrame(() => {
      if (savedLayout) setLayoutState(savedLayout);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setLayout = React.useCallback((newLayout: LayoutPreference) => {
    setLayoutState(newLayout);
    localStorage.setItem('layoutPreference', newLayout);
    document.documentElement.dataset.layout = newLayout;
  }, []);

  return (
    <NextThemesProvider {...props}>
      <LayoutContext.Provider value={{ layout, setLayout }}>
        {children}
      </LayoutContext.Provider>
    </NextThemesProvider>
  );
}
