'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, MapPin, Clock, Headphones, Monitor, Sparkles, ChevronLeft, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Link from 'next/link';
import InteractiveCanvas from '@/components/minimal/InteractiveCanvas';

interface ProfileData {
  id: string;
  handle: string;
  displayName: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  currentGrind: string | null;
  instagram: string | null;
  twitter: string | null;
  github: string | null;
  customLinks: string[];
  bio: string | null;
  programmingTools: string[];
  activeGoals: string[];
  location?: string | null;
  timezone?: string | null;
  whatImBuilding?: string | null;
  currentMood?: string | null;
  favoriteMusic?: string | null;
  deepWorkHours?: string | null;
  setupDetails?: string | null;
}

interface MinimalProfileViewProps {
  profile: ProfileData;
  level: number;
  title: string;
  studyGrid: { date: string; minutesStudied: number }[];
  isOwner?: boolean;
}

function sanitizeSocialLink(input: string, platform: 'instagram' | 'twitter' | 'github') {
  if (!input) return null;
  const cleanInput = input.trim();
  if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
    try {
      new URL(cleanInput);
      return cleanInput;
    } catch {
      return null;
    }
  }
  const handle = cleanInput.startsWith('@') ? cleanInput.substring(1) : cleanInput;
  if (!handle) return null;
  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'twitter': return `https://x.com/${handle}`;
    case 'github': return `https://github.com/${handle}`;
    default: return null;
  }
}

export function MinimalProfileView({ profile, level, title, studyGrid, isOwner }: MinimalProfileViewProps) {
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
  const isColor = profile.bannerUrl?.startsWith('#');

  // Fix the @@notty issue by ensuring only one @
  const displayHandle = profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
          <Link href="/dashboard/minimal" className={`flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase transition-colors hover:scale-105 transform duration-300 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black font-bold'}`}>
            <ChevronLeft size={14} /> Back to Hub
          </Link>
          <div className="flex items-center gap-3 py-2 px-4 rounded-full border border-neutral-500/10 bg-black/5 dark:bg-black/30 backdrop-blur-2xl w-full sm:w-auto justify-center">
            <Clock className={`w-4 h-4 ${isDark ? 'opacity-50' : 'opacity-70'}`} />
            <span className={`text-xs font-mono tracking-widest select-all ${isDark ? 'opacity-80' : 'opacity-100 font-bold'}`}>
              {currentTime}
            </span>
          </div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full flex flex-col gap-8">
          
          {/* Identity Header */}
          <motion.div variants={itemVariants} className={`relative overflow-hidden border shadow-2xl rounded-[3rem] ${isDark ? 'border-white/10 bg-black/40 backdrop-blur-3xl' : 'border-black/10 bg-white/40 backdrop-blur-3xl'}`}>
            <div className="h-48 md:h-72 relative">
              {profile.bannerUrl ? (
                isColor ? (
                  <div className="w-full h-full opacity-60 mix-blend-overlay" style={{ backgroundColor: profile.bannerUrl }}></div>
                ) : (
                  <img src={profile.bannerUrl} alt="Banner" className={`w-full h-full object-cover opacity-80 ${isDark ? 'mix-blend-overlay' : 'mix-blend-multiply'}`} />
                )
              ) : (
                <div className={`w-full h-full ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-200/50'}`}></div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505] to-transparent' : 'from-[#fafafa] to-transparent'}`}></div>
            </div>

            <div className="absolute top-6 right-6">
              <div className={`px-4 py-2 rounded-full border text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 backdrop-blur-md shadow-xl ${isDark ? 'border-white/20 bg-black/50 text-white' : 'border-black/20 bg-white/50 text-black'}`}>
                <Sparkles size={12} className={isDark ? 'text-white' : 'text-black'} />
                LVL {level} // {title}
              </div>
            </div>

            <div className="px-8 pb-10 relative -mt-24 flex flex-col md:flex-row md:items-end gap-8">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-[6px] flex items-center justify-center overflow-hidden shrink-0 shadow-2xl ${isDark ? 'border-[#050505] bg-neutral-900 text-neutral-600' : 'border-[#fafafa] bg-white text-neutral-400'}`}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black">
                    {profile.handle.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <span className={`text-[10px] font-mono tracking-[0.4em] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500 font-bold'}`}>
                  OPERATIVE IDENTITY
                </span>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] mt-1 mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
                  {profile.displayName || profile.handle}
                </h1>
                <div className={`flex flex-wrap items-center gap-6 text-[10px] font-mono tracking-widest uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  <span className={isDark ? 'text-white font-bold' : 'text-black font-bold'}>{displayHandle}</span>
                  {profile.location && (
                    <span className="flex items-center gap-2"><MapPin size={12} /> {profile.location}</span>
                  )}
                  {profile.timezone && (
                    <span className="flex items-center gap-2"><Clock size={12} /> {profile.timezone}</span>
                  )}
                </div>
              </div>
              
              {(profile.instagram || profile.twitter || profile.github || profile.customLinks.length > 0) && (
                <div className="flex flex-wrap gap-3 pb-2">
                  {sanitizeSocialLink(profile.instagram || '', 'instagram') && (
                    <a href={sanitizeSocialLink(profile.instagram || '', 'instagram')!} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full border transition-all duration-300 transform hover:scale-110 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-600 hover:text-black'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                  )}
                  {sanitizeSocialLink(profile.twitter || '', 'twitter') && (
                    <a href={sanitizeSocialLink(profile.twitter || '', 'twitter')!} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full border transition-all duration-300 transform hover:scale-110 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-600 hover:text-black'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                  )}
                  {sanitizeSocialLink(profile.github || '', 'github') && (
                    <a href={sanitizeSocialLink(profile.github || '', 'github')!} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full border transition-all duration-300 transform hover:scale-110 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-600 hover:text-black'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    </a>
                  )}
                  {profile.customLinks.map((link, idx) => {
                    try {
                      new URL(link);
                      return (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full border transition-all duration-300 transform hover:scale-110 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-600 hover:text-black'}`}>
                          <ExternalLink size={16} />
                        </a>
                      );
                    } catch {
                      return null;
                    }
                  })}
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="md:col-span-1 space-y-8">
              
              {/* Status Card */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Current Status</h3>
                  <div className="space-y-6">
                    {profile.currentGrind && (
                      <div>
                        <div className={`text-[8px] font-mono tracking-widest uppercase mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>The Grind</div>
                        <div className="text-sm font-medium">{profile.currentGrind}</div>
                      </div>
                    )}
                    {profile.whatImBuilding && (
                      <div>
                        <div className={`text-[8px] font-mono tracking-widest uppercase mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Building</div>
                        <div className="text-sm font-medium">{profile.whatImBuilding}</div>
                      </div>
                    )}
                    {profile.currentMood && (
                      <div>
                        <div className={`text-[8px] font-mono tracking-widest uppercase mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Mood</div>
                        <div className="text-sm font-medium">{profile.currentMood}</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Aesthetics Card */}
              {(profile.favoriteMusic || profile.deepWorkHours || profile.setupDetails) && (
                <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                  <MagneticGlare />
                  <div className="relative z-10">
                    <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Vibe & Setup</h3>
                    <div className="space-y-6">
                      {profile.favoriteMusic && (
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-[8px] font-mono tracking-widest uppercase flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <Headphones size={10} /> Music
                          </div>
                          <div className="text-sm font-medium">{profile.favoriteMusic}</div>
                        </div>
                      )}
                      {profile.deepWorkHours && (
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-[8px] font-mono tracking-widest uppercase flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <Clock size={10} /> Deep Work
                          </div>
                          <div className="text-sm font-medium">{profile.deepWorkHours}</div>
                        </div>
                      )}
                      {profile.setupDetails && (
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-[8px] font-mono tracking-widest uppercase flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <Monitor size={10} /> Setup
                          </div>
                          <div className="text-sm font-medium text-balance">{profile.setupDetails}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Bio Card */}
              {profile.bio && (
                <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                  <MagneticGlare />
                  <div className="relative z-10">
                    <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>About</h3>
                    <p className={`text-base leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {profile.bio}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Skills & Goals Card */}
              {(profile.programmingTools.length > 0 || profile.activeGoals.length > 0) && (
                <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                  <MagneticGlare />
                  <div className="relative z-10">
                    {profile.programmingTools.length > 0 && (
                      <div className="mb-10 last:mb-0">
                        <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Stack & Tools</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.programmingTools.map((tool, idx) => (
                            <span key={`${tool}-${idx}`} className={`px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'border-white/10 bg-white/5 text-neutral-300' : 'border-black/10 bg-black/5 text-neutral-700'}`}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.activeGoals.length > 0 && (
                      <div className="last:mb-0">
                        <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Current Objectives</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.activeGoals.map((goal, idx) => (
                            <span key={`${goal}-${idx}`} className={`px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'border-white/50 bg-white/10 text-white' : 'border-black/50 bg-black/10 text-black'}`}>
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Stats Card */}
              <motion.div variants={itemVariants} className={glassCardClasses} onMouseMove={handleMouseMove}>
                <MagneticGlare />
                <div className="relative z-10">
                  <h3 className={`text-[9px] font-mono font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Operative Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                      <div className={`text-[8px] font-mono tracking-widest uppercase mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Deep Work Logs</div>
                      <div className="text-3xl font-black tracking-tighter">
                        {Math.floor(studyGrid.reduce((sum, d) => sum + d.minutesStudied, 0) / 60)}<span className="text-lg text-neutral-500 ml-1">HRS</span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                      <div className={`text-[8px] font-mono tracking-widest uppercase mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Active Days</div>
                      <div className="text-3xl font-black tracking-tighter">
                        {studyGrid.filter(d => d.minutesStudied > 0).length}
                      </div>
                    </div>
                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                      <div className={`text-[8px] font-mono tracking-widest uppercase mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Current Rank</div>
                      <div className="text-xl font-bold tracking-tight uppercase leading-none">
                        {title}
                      </div>
                    </div>
                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                      <div className={`text-[8px] font-mono tracking-widest uppercase mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Clearance Level</div>
                      <div className="text-3xl font-black tracking-tighter">
                        {level}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Edit Profile Button (Only for owner) */}
          {isOwner && (
            <motion.div variants={itemVariants} className="mt-8 mb-8 flex justify-center">
              <Link href="/settings/minimal" className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-105 shadow-2xl ${isDark ? 'bg-neutral-900/60 backdrop-blur-2xl border-white/20 hover:border-white/40 text-white hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'bg-white/60 backdrop-blur-2xl border-black/20 hover:border-black/40 text-black hover:shadow-[0_0_40px_rgba(0,0,0,0.1)]'} border`}>
                <Settings size={18} className={`transition-transform duration-500 group-hover:rotate-90`} />
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Edit Profile</span>
              </Link>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
