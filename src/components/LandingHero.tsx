'use client';

import { useState } from 'react';
import { AuthModal } from './AuthModal';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users, Target, Shield, Mail, Twitter, Github } from 'lucide-react';

type Section = 'goal' | 'about' | 'contact' | null;
const SECTIONS: Section[] = ['goal', 'about', 'contact'];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export function LandingHero() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [direction, setDirection] = useState(1);

  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const handleActionClick = (mode: 'sign-in' | 'sign-up') => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
      return;
    }
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavClick = (section: Section) => {
    if (activeSection === section) {
      setActiveSection(null);
      return;
    }
    const currentIndex = activeSection ? SECTIONS.indexOf(activeSection) : -1;
    const newIndex = SECTIONS.indexOf(section);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveSection(section);
  };

  const isOverlayOpen = activeSection !== null;

  return (
    <>
      <div className="relative min-h-screen w-full bg-[url('/forpage.jpg')] bg-cover bg-center overflow-hidden flex flex-col z-0">
      {/* Background Blur Overlay controlled by Modal State */}
      <div 
        className={`absolute inset-0 z-30 transition-all duration-500 pointer-events-none ${isAuthModalOpen ? 'backdrop-blur-md bg-black/20' : 'backdrop-blur-0 bg-transparent'}`}
      />

      {/* Navbar Wrapper (Z-Index: 50) */}
      <div className="absolute top-0 w-full flex justify-center z-50 pointer-events-none">
        <motion.nav 
          layout
          className={`pointer-events-auto flex justify-between items-center bg-black/30 backdrop-blur-xl border-white/10 px-8 h-14
            ${isOverlayOpen 
              ? 'w-full rounded-none border-b mt-0' 
              : 'w-[95%] max-w-6xl !rounded-[9999px] border mt-8'}`}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="font-sans text-xl font-bold tracking-tighter text-white uppercase">
            Monolith
          </div>

          {/* Center Links */}
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <button onClick={() => handleNavClick('goal')} className={`${activeSection === 'goal' ? 'text-white' : 'text-white/80'} hover:text-white transition-colors`}>Our Goal</button>
            <button onClick={() => handleNavClick('about')} className={`${activeSection === 'about' ? 'text-white' : 'text-white/80'} hover:text-white transition-colors`}>About the Creator</button>
            <button onClick={() => handleNavClick('contact')} className={`${activeSection === 'contact' ? 'text-white' : 'text-white/80'} hover:text-white transition-colors`}>Contact</button>
          </div>

          <div className="flex gap-4 items-center">
             {isLoaded && !isSignedIn && (
               <>
                 <button onClick={() => handleActionClick('sign-in')} className="px-6 py-2 bg-white/10 border border-transparent text-white/90 hover:text-white hover:bg-white/20 !rounded-[9999px] transition-all text-sm font-semibold">Login</button>
                 <button onClick={() => handleActionClick('sign-up')} className="px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-sm !rounded-[9999px] hover:bg-white/30 transition-all shadow-lg">Sign Up</button>
               </>
             )}
             {isLoaded && isSignedIn && (
               <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-sm !rounded-[9999px] hover:bg-white/30 transition-all shadow-lg">Dashboard</button>
             )}
          </div>
        </motion.nav>
      </div>

      {/* Hero Content with scaling and blurring (Z-Index: 10 via flow) */}
      <motion.main 
        animate={{
          scale: isOverlayOpen ? 0.98 : 1,
          filter: isOverlayOpen ? 'blur(12px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-20"
      >
        {/* Absolute positioned button to sit cleanly below the focal bird */}
        <div className="absolute bottom-32 flex gap-4">
          <button 
             onClick={() => handleActionClick('sign-up')}
             className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-lg !rounded-[9999px] hover:bg-white/20 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Enter the Focus Zone
          </button>
        </div>
      </motion.main>

      {/* The Bottom-Up Overlay (Z-Index: 40) */}
      <AnimatePresence>
        {isOverlayOpen && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none mt-16 gap-2">
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="pointer-events-auto relative max-w-6xl w-[95%] h-[80vh] rounded-[2rem] bg-[#0a0a0a]/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              <div className="flex-1 relative w-full h-full">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={activeSection}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0 p-12 md:p-16 flex flex-col"
                  >
                    {activeSection === 'goal' && (
                      <div className="text-white h-full flex flex-col overflow-hidden">
                        {/* Static Header */}
                        <div className="flex-shrink-0 mb-8">
                          <h2 className="text-4xl font-bold tracking-tighter font-sans">Our Goal</h2>
                        </div>
                        
                        {/* Scrolling Masked Body */}
                        <div className="flex-grow overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)]">
                          <div className="pb-32 flex flex-col gap-10">
                            <p className="text-xl text-white/80 leading-loose font-light">
                              Remote deep-work and studying can feel incredibly isolating. We built this platform to cure that loneliness. 
                              By connecting you with peers in a dedicated, distraction-free environment, we aim to recreate the focused energy 
                              of a library or a shared workspace—right from your browser.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-3xl p-6 h-auto min-h-[140px] shrink-0 flex flex-col justify-center items-start gap-4 backdrop-blur-md">
                                <Target className="w-8 h-8 text-white/60" />
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">Deep Focus</h3>
                                  <p className="text-sm text-white/50 leading-relaxed">Optimized environments designed to keep you in flow state for longer.</p>
                                </div>
                              </div>
                              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-3xl p-6 h-auto min-h-[140px] shrink-0 flex flex-col justify-center items-start gap-4 backdrop-blur-md">
                                <Users className="w-8 h-8 text-white/60" />
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">Shared Energy</h3>
                                  <p className="text-sm text-white/50 leading-relaxed">Work alongside others. The silent presence of peers acts as an anchor.</p>
                                </div>
                              </div>
                              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-3xl p-6 h-auto min-h-[140px] shrink-0 flex flex-col justify-center items-start gap-4 backdrop-blur-md">
                                <Shield className="w-8 h-8 text-white/60" />
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">Distraction Free</h3>
                                  <p className="text-sm text-white/50 leading-relaxed">No social feeds. No notifications. Just you, your work, and your space.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeSection === 'about' && (
                      <div className="text-white h-full flex flex-col overflow-hidden">
                        {/* Static Header */}
                        <div className="flex-shrink-0 mb-8">
                          <h2 className="text-4xl font-bold tracking-tighter font-sans">The Origin</h2>
                        </div>
                        
                        {/* Scrolling Masked Body */}
                        <div className="flex-grow overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)]">
                          <div className="pb-32 flex flex-col md:flex-row gap-12 items-start justify-between">
                            <div className="flex-1 max-w-2xl">
                              <div className="relative">
                                <div className="absolute -left-6 -top-4 text-6xl text-white/10 font-serif">"</div>
                                <p className="text-xl text-white/80 leading-loose mb-6 italic font-light relative z-10">
                                  I started building this platform because I struggled with staying focused while working alone. 
                                  I missed the quiet accountability of working alongside others.
                                </p>
                                <p className="text-xl text-white/80 leading-loose italic font-light relative z-10">
                                  My vision is to create a seamless, high-quality space where anyone, anywhere, can drop in and instantly 
                                  find the motivation they need to do their best work.
                                </p>
                                <p className="text-xl text-white/80 leading-loose italic font-light relative z-10 mt-6">
                                  The goal is not just productivity, but the feeling of shared human presence while you work on the things that matter most to you.
                                </p>
                              </div>
                            </div>
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-xl relative overflow-hidden shrink-0 mx-auto md:mx-0">
                              <div className="absolute inset-0 bg-[url('/forpage.jpg')] opacity-20 mix-blend-overlay bg-cover bg-center" />
                              <span className="text-white/40 font-semibold tracking-widest uppercase text-sm z-10">Creator</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeSection === 'contact' && (
                      <div className="text-white h-full flex flex-col overflow-hidden">
                        {/* Static Header */}
                        <div className="flex-shrink-0 mb-8 flex flex-col items-center text-center">
                          <h2 className="text-4xl font-bold tracking-tighter mb-4 font-sans">Get in Touch</h2>
                          <p className="text-lg text-white/60 max-w-md font-light">
                            Have ideas, feedback, or want to collaborate? We'd love to hear from you.
                          </p>
                        </div>
                        
                        {/* Scrolling Masked Body */}
                        <div className="flex-grow overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_95%,transparent_100%)]">
                          <div className="pb-32 flex flex-col items-center gap-4">
                            <div className="flex flex-col gap-4 w-full max-w-lg">
                              <a href="mailto:raiderark534@gmail.com" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-colors">
                                <div className="bg-white/10 p-4 !rounded-[9999px]">
                                  <Mail className="w-5 h-5 text-white/80" />
                                </div>
                                <div className="text-left flex-1">
                                  <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">Email</div>
                                  <div className="font-medium text-white/90">raiderark534@gmail.com</div>
                                </div>
                              </a>
                              
                              <a href="#" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-colors">
                                <div className="bg-white/10 p-4 !rounded-[9999px]">
                                  <Twitter className="w-5 h-5 text-white/80" />
                                </div>
                                <div className="text-left flex-1">
                                  <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">X (Twitter)</div>
                                  <div className="font-medium text-white/90">@monolith_study</div>
                                </div>
                              </a>

                              <a href="#" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-colors">
                                <div className="bg-white/10 p-4 !rounded-[9999px]">
                                  <Github className="w-5 h-5 text-white/80" />
                                </div>
                                <div className="text-left flex-1">
                                  <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">GitHub</div>
                                  <div className="font-medium text-white/90">View Projects</div>
                                </div>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Down Arrow Close Button at bottom */}
            <div className="flex justify-center shrink-0 z-20 pointer-events-none">
              <motion.button 
                onClick={() => setActiveSection(null)}
                className="pointer-events-auto p-2 text-white transition-all flex items-center justify-center group"
                aria-label="Close"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                <ChevronDown className="w-10 h-10 text-white/60 group-hover:text-white transition-colors" />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal (Z-Index: 60 inside component) */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
      </div>
    </>
  );
}
