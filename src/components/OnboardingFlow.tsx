'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateOnboardingProfile } from '@/app/actions/user-actions';

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

export function OnboardingFlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0); // 0 = off, 1-3 = tour, 4 = profile form
  
  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [focusStyle, setFocusStyle] = useState('');
  const [ambience, setAmbience] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasCompletedOnboarding');
    if (!hasOnboarded) {
      setIsVisible(true);
      setTourStep(1); // Start tour
    }
  }, []);

  const handleCompleteTour = () => {
    setTourStep(4); // Move to profile form
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    await updateOnboardingProfile({
      displayName,
      handle,
      subjects: selectedSubjects,
      focusPreference: focusStyle,
      defaultAmbience: ambience
    });
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setIsSubmitting(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {/* GUIDED TOUR TOOLTIPS */}
      {tourStep >= 1 && tourStep <= 3 && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {tourStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface border border-border p-6 shadow-2xl max-w-sm w-full pointer-events-auto"
              >
                <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-primary)]">Welcome to Monolith</h3>
                <p className="text-secondary text-sm mb-6">This is your dashboard. Here you can find public spaces, create your own solo room, or resume a previous session.</p>
                <button onClick={() => setTourStep(2)} className="w-full py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-primary transition-colors">Next</button>
              </motion.div>
            )}
            {tourStep === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface border border-border p-6 shadow-2xl max-w-sm w-full pointer-events-auto"
              >
                <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-primary)]">Focus OS</h3>
                <p className="text-secondary text-sm mb-6">Once you enter a room, you'll have access to the Widget Canvas, global Pomodoro timers, and distraction-free collaboration.</p>
                <button onClick={() => setTourStep(3)} className="w-full py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-primary transition-colors">Next</button>
              </motion.div>
            )}
            {tourStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface border border-border p-6 shadow-2xl max-w-sm w-full pointer-events-auto"
              >
                <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-primary)]">Profile Setup</h3>
                <p className="text-secondary text-sm mb-6">Before you start, let's establish your identity and preferences to tailor your experience.</p>
                <button onClick={handleCompleteTour} className="w-full py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-primary transition-colors">Set up Profile</button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE SETUP FORM */}
      {tourStep === 4 && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground overflow-y-auto">
          {/* Header */}
          <header className="p-6 flex justify-between items-center border-b border-border bg-surface sticky top-0 z-10">
            <div className="font-[family-name:var(--font-primary)] font-semibold tracking-[-0.02em] text-xl uppercase">Monolith Setup</div>
            <div className="font-[family-name:var(--font-primary)] text-secondary text-sm">
              {formStep} / 4
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full min-h-[80vh]">
            <AnimatePresence mode="wait">
              {formStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6 w-full max-w-md mx-auto"
                >
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
                </motion.div>
              )}

              {formStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6 w-full"
                >
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
                </motion.div>
              )}

              {formStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6 w-full"
                >
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
                </motion.div>
              )}

              {formStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6 w-full"
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="mt-16 w-full max-w-md flex items-center justify-between">
              <button 
                onClick={() => {
                  if (formStep === 4) handleCompleteOnboarding();
                  else setFormStep(formStep + 1);
                }}
                className="text-secondary font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest hover:text-foreground transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Skip for now →
              </button>
              
              <button 
                onClick={() => {
                  if (formStep === 4) handleCompleteOnboarding();
                  else setFormStep(formStep + 1);
                }}
                disabled={
                  isSubmitting ||
                  (formStep === 1 && (!displayName || !handle)) || 
                  (formStep === 2 && selectedSubjects.length === 0) ||
                  (formStep === 3 && !focusStyle) ||
                  (formStep === 4 && !ambience)
                }
                className="px-8 py-3 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-sm tracking-widest uppercase transition-transform duration-120 ease-out active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? 'Saving...' : formStep === 4 ? 'Complete' : 'Continue'}
              </button>
            </div>
          </main>
        </div>
      )}
    </AnimatePresence>
  );
}
