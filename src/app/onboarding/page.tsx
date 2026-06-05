'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/app/actions/user-actions';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => prev + 1);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await completeOnboarding(formData);
    if (result?.success) {
      router.push('/dashboard/traditional');
    } else {
      setLoading(false);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-2xl z-10">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-[family-name:var(--font-primary)] font-black tracking-tighter uppercase text-white mb-2">
            System Initialization
          </h1>
          <p className="text-neutral-400 font-[family-name:var(--font-primary)] text-sm uppercase tracking-widest">
            Configure your Monolith identity. Step {step} of 3
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <div className={`h-1 w-12 ${step >= 1 ? 'bg-primary' : 'bg-neutral-800'}`} />
            <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-neutral-800'}`} />
            <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-neutral-800'}`} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl relative">
          {/* Step 1: Core Identity */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-6 border-b border-white/10 pb-2">
              Core Identity
            </h2>
            <div className="space-y-6">
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Display Name</label>
                <input 
                  type="text" 
                  name="displayName"
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    placeholder="City, Country"
                    className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Timezone</label>
                  <input 
                    type="text" 
                    name="timezone"
                    placeholder="UTC-5"
                    className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: The Grind */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-6 border-b border-white/10 pb-2">
              Status Matrix
            </h2>
            <div className="space-y-6">
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Current Grind</label>
                <input 
                  type="text" 
                  name="currentGrind"
                  placeholder="e.g. Deep Study Mode"
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">What I'm Building</label>
                <input 
                  type="text" 
                  name="whatImBuilding"
                  placeholder="e.g. AI Startup"
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Deep Work Hours</label>
                <input 
                  type="text" 
                  name="deepWorkHours"
                  placeholder="10 PM - 2 AM"
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Aesthetics */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-6 border-b border-white/10 pb-2">
              Aesthetics & Lore
            </h2>
            <div className="space-y-6">
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Extended Bio</label>
                <textarea 
                  name="bio"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Current Mood</label>
                  <input 
                    type="text" 
                    name="currentMood"
                    className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Favorite Music</label>
                  <input 
                    type="text" 
                    name="favoriteMusic"
                    className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Banner Image URL</label>
                <input 
                  type="text" 
                  name="bannerUrl"
                  className="w-full bg-white/5 border border-white/10 p-3 font-[family-name:var(--font-primary)] text-sm text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-white/20 text-neutral-400 font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest hover:text-white hover:border-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-white text-black font-[family-name:var(--font-primary)] font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors"
              >
                Next Phase
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground font-[family-name:var(--font-primary)] font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Complete Initialization'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
