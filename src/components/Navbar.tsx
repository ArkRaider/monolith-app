'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50 flex items-center justify-between px-8 py-4 bg-[#0D0F14]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
      <div className="flex items-center gap-12">
        <Link href="/">
          <span className="font-bold text-xl tracking-tighter font-[family-name:var(--font-primary)] text-white">MONOLITH</span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm text-gray-400 font-medium">
          <Link href="#our-goal" className="hover:text-white transition-colors">Our Goal</Link>
          <Link href="#about" className="hover:text-white transition-colors">About the Creator</Link>
          <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>

      {/* Right: Theme Toggle & Auth */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
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

        {/* Clerk Auth - Logged Out */}
        {isLoaded && !isSignedIn && (
          <>
            <button
              onClick={() => router.push('/sign-in')}
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/sign-up')}
              className="text-sm font-semibold px-5 py-2 bg-foreground text-background transition-colors hover:bg-primary/90 rounded-full shadow-md"
            >
              Sign Up
            </button>
          </>
        )}

        {/* Clerk Auth - Logged In */}
        {isLoaded && isSignedIn && (
          <>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-semibold px-5 py-2 bg-primary text-background transition-colors hover:opacity-90 mr-2 rounded-full"
            >
              Dashboard
            </button>
            <UserButton afterSignOutUrl="/" />
          </>
        )}
      </div>

    </nav>
  );
}