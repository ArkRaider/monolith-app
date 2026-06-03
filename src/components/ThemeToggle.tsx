'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full border border-border bg-surface hover:bg-surface-high transition-colors flex items-center justify-center text-foreground"
      aria-label="Toggle theme"
    >
      {mounted ? (
        theme === 'light' ? <Moon size={18} /> : <Sun size={18} />
      ) : (
        <div className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
