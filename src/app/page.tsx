'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useTheme } from 'next-themes';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="landing-page min-h-screen bg-background text-foreground flex flex-col items-center">
      <Navbar />

      <main className="flex flex-col items-center w-full pt-40">
        {/* Hero Section */}
        <section className="w-full max-w-5xl flex flex-col items-center justify-center min-h-[60vh] text-center px-6 pb-20 relative overflow-hidden">
          {/* Subtle glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-indigo-500/40 blur-[150px] rounded-full pointer-events-none -z-10" />
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-[family-name:var(--font-primary)] tracking-tight">
            Study together, <br className="hidden md:block"/> achieve together
          </h1>
          <p className="text-xl md:text-2xl text-secondary mb-10 max-w-2xl font-[family-name:var(--font-primary)]">
            Join a distraction-free, high-quality collaboration space. Focus on what matters, alongside others who are doing the same.
          </p>
          
          <button 
            onClick={() => router.push('/sign-up')}
            className="px-8 py-4 bg-foreground text-background font-bold text-lg rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            Enter the Focus Zone
          </button>
        </section>

        {/* Mission / Our Goal Section */}
        <section id="our-goal" className="w-full max-w-5xl px-6 py-24 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold mb-8 font-[family-name:var(--font-primary)]">Our Goal</h2>
          <p className="text-lg text-foreground/80 max-w-3xl leading-relaxed">
            Remote deep-work and studying can feel incredibly isolating. We built this platform to cure that loneliness. 
            By connecting you with peers in a dedicated, distraction-free environment, we aim to recreate the focused energy 
            of a library or a shared workspace—right from your browser.
          </p>
        </section>

        {/* About the Creator Section */}
        <section id="about" className="w-full bg-surface px-6 py-24">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6 font-[family-name:var(--font-primary)]">Message from Arkit</h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  "I started building this platform because I struggled with staying focused while working alone. 
                  I missed the quiet accountability of working alongside others."
                </p>
                <p>
                  "My vision is to create a seamless, high-quality space where anyone, anywhere, can drop in and instantly 
                  find the motivation they need to do their best work."
                </p>
              </div>
            </div>
            <div className="w-48 h-48 bg-surface-high border border-border flex items-center justify-center shrink-0 rounded-full shadow-lg">
              <span className="text-secondary font-medium">Arkit's Photo</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
