'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, User, Save, Clock } from 'lucide-react';
import InteractiveCanvas from '@/components/minimal/InteractiveCanvas';
import { updateProfile } from '@/app/actions/user-actions';

interface MinimalSettingsClientProps {
  dbUser: any;
}

export default function MinimalSettingsClient({ dbUser }: MinimalSettingsClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const glassCardClasses = `relative overflow-hidden border transition-all duration-500 shadow-xl group ${
    isDark 
      ? 'bg-neutral-900/60 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)]' 
      : 'bg-white/60 backdrop-blur-2xl border-black/10 hover:border-black/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
  } rounded-[2.5rem] p-8`;

  const inputClasses = `w-full bg-transparent border-b ${isDark ? 'border-white/20 focus:border-white text-white' : 'border-black/20 focus:border-black text-black'} p-2 font-mono text-sm focus:outline-none transition-colors`;
  const textareaClasses = `w-full bg-transparent border ${isDark ? 'border-white/20 focus:border-white text-white' : 'border-black/20 focus:border-black text-black'} rounded-xl p-4 font-mono text-sm focus:outline-none transition-colors resize-none`;
  const labelClasses = `font-mono text-[10px] tracking-widest uppercase font-bold mb-2 block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`;

  const MagneticGlare = () => (
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isDark ? 'mix-blend-overlay' : 'mix-blend-multiply'}`}
         style={{ background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}, transparent 40%)` }}
    />
  );

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden flex flex-col justify-start font-sans leading-relaxed transition-colors duration-700 select-text ${
        isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-950'
      }`}
      style={{ backgroundColor: isDark ? '#050505' : '#fafafa' }}
    >
      <InteractiveCanvas theme={theme as any} />
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/minimal-assets/images/architectural_void_1780392871749.png"
          alt="Spatial Brutalist Architecture"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-[1200ms] ease-out scale-110 opacity-[0.08] filter blur-xl lg:blur-2xl mix-blend-overlay`}
        />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col justify-start max-w-[85rem] mx-auto px-6 sm:px-12 md:px-16 pt-12 pb-32">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-500/10 pb-6 mb-12">
          <Link href={`/profile/${dbUser.handle}?theme=minimal`} className={`flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase transition-colors hover:scale-105 transform duration-300 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black font-bold'}`}>
            <ChevronLeft size={14} /> Back to Profile
          </Link>
          <div className="flex items-center gap-3 py-2 px-4 rounded-full border border-neutral-500/10 bg-black/5 dark:bg-black/30 backdrop-blur-2xl w-full sm:w-auto justify-center">
            <Clock className={`w-4 h-4 ${isDark ? 'opacity-50' : 'opacity-70'}`} />
            <span className={`text-xs font-mono tracking-widest select-all ${isDark ? 'opacity-80' : 'opacity-100 font-bold'}`}>
              {currentTime}
            </span>
          </div>
        </header>

        <form action={async (formData) => {
          await updateProfile(formData);
          // Optional: Handle success state here
        }}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full flex flex-col gap-8">
            
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-4">Identity Configuration</h1>
                <p className={`font-mono text-sm tracking-widest uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Calibrate your operative parameters
                </p>
              </div>
              <button type="submit" className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-105 shadow-2xl ${isDark ? 'bg-white text-black hover:bg-neutral-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]' : 'bg-black text-white hover:bg-neutral-800 hover:shadow-[0_0_40px_rgba(0,0,0,0.2)]'}`}>
                <Save size={18} className="transition-transform duration-500 group-hover:scale-110" />
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Save Changes</span>
              </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Core Parameters */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10 space-y-8">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Core Parameters</h3>
                  
                  <div>
                    <label className={labelClasses}>Display Name</label>
                    <input type="text" name="displayName" defaultValue={dbUser.displayName || ''} className={`${inputClasses} text-2xl font-bold`} required />
                  </div>
                  <div>
                    <label className={labelClasses}>Banner Image URL</label>
                    <input type="text" name="bannerUrl" defaultValue={dbUser.bannerUrl || ''} className={inputClasses} placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Location</label>
                      <input type="text" name="location" defaultValue={dbUser.location || ''} className={inputClasses} placeholder="City, Country" />
                    </div>
                    <div>
                      <label className={labelClasses}>Timezone</label>
                      <input type="text" name="timezone" defaultValue={dbUser.timezone || ''} className={inputClasses} placeholder="UTC-5" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Biography</label>
                    <textarea name="bio" defaultValue={dbUser.bio || ''} rows={4} className={textareaClasses} placeholder="Document your journey..."></textarea>
                  </div>
                </div>
              </motion.div>

              {/* State Matrix */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10 space-y-8">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-white' : 'text-black'}`}>State Matrix</h3>
                  
                  <div>
                    <label className={labelClasses}>Current Grind</label>
                    <input type="text" name="currentGrind" defaultValue={dbUser.currentGrind || ''} className={inputClasses} placeholder="Deep Study Mode" />
                  </div>
                  <div>
                    <label className={labelClasses}>What I'm Building</label>
                    <input type="text" name="whatImBuilding" defaultValue={dbUser.whatImBuilding || ''} className={inputClasses} placeholder="AI Startup" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Current Mood</label>
                      <input type="text" name="currentMood" defaultValue={dbUser.currentMood || ''} className={inputClasses} placeholder="Locked In 🔒" />
                    </div>
                    <div>
                      <label className={labelClasses}>Favorite Music</label>
                      <input type="text" name="favoriteMusic" defaultValue={dbUser.favoriteMusic || ''} className={inputClasses} placeholder="Synthwave" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Deep Work Hours</label>
                    <input type="text" name="deepWorkHours" defaultValue={dbUser.deepWorkHours || ''} className={inputClasses} placeholder="10 PM - 2 AM" />
                  </div>
                  <div>
                    <label className={labelClasses}>Setup Details</label>
                    <input type="text" name="setupDetails" defaultValue={dbUser.setupDetails || ''} className={inputClasses} placeholder="MacBook Pro, Ultrawide..." />
                  </div>
                </div>
              </motion.div>

              {/* Skill Trees */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10 space-y-8">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Skill Trees</h3>
                  
                  <div>
                    <label className={labelClasses}>Programming Tools (Comma Separated)</label>
                    <textarea name="programmingTools" defaultValue={dbUser.programmingTools?.join(', ') || ''} rows={3} className={textareaClasses} placeholder="React, Python, Figma..."></textarea>
                  </div>
                  <div>
                    <label className={labelClasses}>Active Goals (Comma Separated)</label>
                    <textarea name="activeGoals" defaultValue={dbUser.activeGoals?.join(', ') || ''} rows={3} className={textareaClasses} placeholder="Finish thesis, Build app..."></textarea>
                  </div>
                </div>
              </motion.div>

              {/* Communication Links */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10 space-y-8">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Communication Links</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>GitHub</label>
                      <input type="text" name="github" defaultValue={dbUser.github || ''} className={inputClasses} placeholder="@username" />
                    </div>
                    <div>
                      <label className={labelClasses}>Twitter / X</label>
                      <input type="text" name="twitter" defaultValue={dbUser.twitter || ''} className={inputClasses} placeholder="@username" />
                    </div>
                    <div>
                      <label className={labelClasses}>Instagram</label>
                      <input type="text" name="instagram" defaultValue={dbUser.instagram || ''} className={inputClasses} placeholder="@username" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Custom Links (Comma Separated)</label>
                    <textarea name="customLinks" defaultValue={dbUser.customLinks?.join(', ') || ''} rows={3} className={textareaClasses} placeholder="https://portfolio.com..."></textarea>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
