'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center z-10 w-full px-6">
        <h1 className="text-foreground font-[family-name:var(--font-primary)] font-semibold tracking-[-0.04em] text-4xl md:text-5xl uppercase mb-8 leading-none animate-pulse">
          Initializing System...
        </h1>
        
        <div className="flex flex-col items-center gap-4 w-full justify-center relative z-20">
          <Link href="/sign-up">
            <button className="px-10 py-5 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-sm tracking-widest uppercase transition-transform duration-120 ease-out active:scale-[0.98] rounded-[var(--radius)]">
              Let&apos;s continue this journey
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom Live Ticker */}
      <div className="absolute bottom-0 w-full border-t border-border bg-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="font-[family-name:var(--font-primary)] text-foreground text-xs font-medium tracking-wider uppercase">
            System Online
          </span>
        </div>
        <div className="hidden sm:block font-[family-name:var(--font-primary)] text-secondary text-[10px] tracking-widest uppercase">
          Status: Ready
        </div>
      </div>
      
    </main>
  );
}
