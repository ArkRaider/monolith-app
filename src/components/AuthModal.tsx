'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'sign-in' | 'sign-up';
}

export function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop is handled in LandingHero, but we can add a clickable overlay here to close */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl border border-white/20 bg-[url('/forpage.jpg')] bg-cover bg-center"
          >
            {/* Dark glass overlay for the modal itself */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 px-8 py-10 flex flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-light tracking-tight text-white mb-2 font-[family-name:var(--font-primary)]">
                  {mode === 'sign-in' ? 'Welcome Back' : 'Create your space'}
                </h2>
                <p className="text-white/70 text-sm">
                  {mode === 'sign-in' ? 'Sign in to your account to continue' : 'Join the platform to optimize your daily focus engines.'}
                </p>
              </div>

              {/* Clerk Components with glassmorphic styling overrides */}
              <div className="w-full">
                {mode === 'sign-in' ? (
                  <SignIn 
                    routing="hash" 
                    forceRedirectUrl="/dashboard"
                    appearance={{
                      elements: {
                        card: "bg-transparent shadow-none w-full p-0",
                        header: "hidden",
                        formButtonPrimary: "bg-white text-black hover:bg-white/90 rounded-full py-3 font-semibold transition-colors mt-2",
                        formFieldInput: "bg-white/10 border border-white/20 text-white rounded-xl focus:border-white/50 focus:ring-0 p-3 placeholder:text-white/30",
                        formFieldLabel: "text-white/70 text-xs font-semibold uppercase tracking-wider mb-1",
                        socialButtonsBlockButton: "border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full py-3 transition-colors",
                        socialButtonsBlockButtonText: "text-white font-medium",
                        dividerLine: "bg-white/20",
                        dividerText: "text-white/50 text-xs uppercase tracking-widest",
                        footerActionText: "hidden",
                        footerActionLink: "hidden",
                        formFieldInputShowPasswordButton: "text-white/50 hover:text-white",
                        main: "gap-4",
                        formFieldRow: "mb-4",
                      }
                    }}
                  />
                ) : (
                  <SignUp 
                    routing="hash" 
                    forceRedirectUrl="/dashboard"
                    appearance={{
                      elements: {
                        card: "bg-transparent shadow-none w-full p-0",
                        header: "hidden",
                        formButtonPrimary: "bg-white text-black hover:bg-white/90 rounded-full py-3 font-semibold transition-colors mt-2",
                        formFieldInput: "bg-white/10 border border-white/20 text-white rounded-xl focus:border-white/50 focus:ring-0 p-3 placeholder:text-white/30",
                        formFieldLabel: "text-white/70 text-xs font-semibold uppercase tracking-wider mb-1",
                        socialButtonsBlockButton: "border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full py-3 transition-colors",
                        socialButtonsBlockButtonText: "text-white font-medium",
                        dividerLine: "bg-white/20",
                        dividerText: "text-white/50 text-xs uppercase tracking-widest",
                        footerActionText: "hidden",
                        footerActionLink: "hidden",
                        formFieldInputShowPasswordButton: "text-white/50 hover:text-white",
                        identityPreview: "bg-white/10 border border-white/20 rounded-xl p-3 text-white mb-4",
                        identityPreviewText: "text-white",
                        identityPreviewEditButtonIcon: "text-white/70 hover:text-white",
                        formResendCodeLink: "text-white hover:text-white/80",
                        otpCodeFieldInput: "border border-white/20 bg-white/10 text-white rounded-xl focus:border-white/50",
                        main: "gap-4",
                        formFieldRow: "mb-4",
                      }
                    }}
                  />
                )}
              </div>
              
              <div className="mt-8 text-center pt-6 border-t border-white/10 w-full">
                <button 
                  onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                  className="text-white/70 hover:text-white text-sm transition-colors font-medium"
                >
                  {mode === 'sign-in' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
