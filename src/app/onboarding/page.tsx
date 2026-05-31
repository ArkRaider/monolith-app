'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const SUBJECTS = [
  'Engineering', 'Medicine', 'Law', 'CS/Dev', 'Design', 
  'Business', 'Languages', 'Science', 'Arts', 'Other'
];

const FOCUS_STYLES = [
  { id: 'pomodoro', name: 'Pomodoro', desc: '25m work / 5m break' },
  { id: 'deep', name: 'Deep Work', desc: '90m unbroken blocks' },
  { id: 'freeform', name: 'Freeform', desc: 'No structured timer' }
];

const AMBIENCE = ['Silence', 'Lo-Fi', 'Brown Noise', 'Rain', 'Café'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [focusStyle, setFocusStyle] = useState('');
  const [ambience, setAmbience] = useState('');

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
    else handleComplete();
  };

  const skipStep = () => {
    nextStep();
  };

  const handleComplete = async () => {
    // In a real app, we'd save this to our Prisma DB here via a server action
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-border">
        <div className="font-[family-name:var(--font-primary)] font-semibold tracking-[-0.02em] text-xl uppercase">Monolith</div>
        <div className="font-[family-name:var(--font-primary)] text-secondary text-sm">
          {step} / 5
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <div className="w-full transition-opacity duration-120 ease-out">
          {step === 1 && (
            <div className="flex flex-col items-center gap-8">
              <h2 className="text-3xl font-semibold">Establish your identity.</h2>
              <div className="w-32 h-32 border border-border bg-surface flex items-center justify-center text-secondary hover:border-primary transition-colors cursor-pointer active:scale-[0.98]">
                <span className="text-sm font-[family-name:var(--font-primary)] uppercase tracking-widest text-center px-4">Upload<br/>Avatar</span>
              </div>
              <p className="text-secondary text-sm">Square crop. Keep it clean.</p>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
              <h2 className="text-3xl font-semibold mb-2">Who are you?</h2>
              
              <div className="flex flex-col gap-2">
                <label className="font-[family-name:var(--font-primary)] text-xs text-secondary uppercase tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface border border-border p-4 font-[family-name:var(--font-primary)] text-foreground focus:border-primary transition-colors outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-[family-name:var(--font-primary)] text-xs text-secondary uppercase tracking-widest">Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-secondary font-[family-name:var(--font-primary)]">@</span>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-surface border border-border p-4 pl-8 font-[family-name:var(--font-primary)] text-foreground focus:border-primary transition-colors outline-none"
                    placeholder="johndoe"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 w-full">
              <h2 className="text-3xl font-semibold mb-2">What do you study?</h2>
              <div className="flex flex-wrap gap-3">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => {
                      if (selectedSubjects.includes(subj)) {
                        setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
                      } else {
                        setSelectedSubjects([...selectedSubjects, subj]);
                      }
                    }}
                    className={`px-4 py-3 border font-[family-name:var(--font-primary)] text-sm uppercase tracking-wider transition-colors duration-120 active:scale-[0.98] ${
                      selectedSubjects.includes(subj) 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border text-secondary hover:border-secondary'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 w-full">
              <h2 className="text-3xl font-semibold mb-2">Choose your structure.</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {FOCUS_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setFocusStyle(style.id)}
                    className={`p-6 border flex flex-col gap-4 text-left transition-colors duration-120 active:scale-[0.98] ${
                      focusStyle === style.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-secondary'
                    }`}
                  >
                    <div className="font-[family-name:var(--font-primary)] font-semibold text-lg">{style.name}</div>
                    <div className="font-[family-name:var(--font-primary)] text-secondary text-xs">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-6 w-full">
              <h2 className="text-3xl font-semibold mb-2">Set your default ambience.</h2>
              <div className="flex flex-wrap gap-3">
                {AMBIENCE.map(track => (
                  <button
                    key={track}
                    onClick={() => setAmbience(track)}
                    className={`px-6 py-4 border font-[family-name:var(--font-primary)] text-sm uppercase tracking-wider transition-colors duration-120 active:scale-[0.98] ${
                      ambience === track 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border text-secondary hover:border-secondary'
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="mt-16 w-full max-w-md flex items-center justify-between">
          <button 
            onClick={skipStep}
            className="text-secondary font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest hover:text-foreground transition-colors"
          >
            Skip for now →
          </button>
          
          <button 
            onClick={nextStep}
            disabled={
              (step === 2 && !displayName) || 
              (step === 3 && selectedSubjects.length === 0) ||
              (step === 4 && !focusStyle) ||
              (step === 5 && !ambience)
            }
            className="px-8 py-3 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-sm tracking-widest uppercase transition-transform duration-120 ease-out active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {step === 5 ? 'Complete' : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  );
}
