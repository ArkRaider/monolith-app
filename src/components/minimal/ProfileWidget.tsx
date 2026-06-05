'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { X, Save, RefreshCw, Plus, Trash2, ChevronDown, ExternalLink } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useNotification } from '@/context/NotificationContext';
import { getMyProfile, updateProfile } from '@/app/actions/user-actions';

export default function ProfileWidget({ isScrolled = true }: { isScrolled?: boolean }) {
  const { user, isLoaded } = useUser();
  const { isOpen, closeProfile } = useProfile();
  const { theme } = useTheme();
  const { notify } = useNotification();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    handle: '',
    bio: '',
    bannerUrl: '',
    currentGrind: '',
    whatImBuilding: '',
    location: '',
    timezone: '',
    currentMood: '',
    favoriteMusic: '',
    deepWorkHours: '',
    setupDetails: '',
    programmingTools: '',
    activeGoals: '',
    instagram: '',
    twitter: '',
    github: '',
  });

  const [customLinks, setCustomLinks] = useState<{ platform: string; handle: string }[]>([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { profile, error } = await getMyProfile();
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        handle: profile.handle || '',
        bio: profile.bio || '',
        bannerUrl: profile.bannerUrl || '',
        currentGrind: profile.currentGrind || '',
        whatImBuilding: profile.whatImBuilding || '',
        location: profile.location || '',
        timezone: profile.timezone || '',
        currentMood: profile.currentMood || '',
        favoriteMusic: profile.favoriteMusic || '',
        deepWorkHours: profile.deepWorkHours || '',
        setupDetails: profile.setupDetails || '',
        programmingTools: profile.programmingTools?.join(', ') || '',
        activeGoals: profile.activeGoals?.join(', ') || '',
        instagram: profile.instagram || '',
        twitter: profile.twitter || '',
        github: profile.github || '',
      });
      setCustomLinks(
        (profile.customLinks || []).map((link: string) => {
          const [platform, ...rest] = link.split('|');
          return { platform, handle: rest.join('|') };
        })
      );
    } else if (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value as string);
    });
    
    // Append customLinks as JSON string
    const validLinks = customLinks.filter(link => link.platform && link.handle.trim() !== '');
    fd.append('customLinks', JSON.stringify(validLinks.map(link => `${link.platform}|${link.handle}`)));

    const res = await updateProfile(fd);
    setSaving(false);
    
    if (res.success) {
      notify('Profile updated successfully', 'Success');
      closeProfile();
    } else {
      notify(res.error || 'Failed to update profile', 'Error');
    }
  };

  if (!isLoaded || !user) return null;

  const minimalDashboardStyles = {
    '--color-surface': isDark ? 'rgba(23, 23, 23, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    '--color-surface-high': isDark ? 'rgba(38, 38, 38, 0.9)' : 'rgba(244, 244, 245, 0.9)',
    '--color-border': isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    '--color-foreground': isDark ? '#ffffff' : '#111111',
    '--color-secondary': isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    '--color-background': isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(250, 250, 250, 0.9)',
    '--color-primary': isDark ? '#ffffff' : '#000000',
    '--color-primary-foreground': isDark ? '#000000' : '#ffffff',
    '--border-weight': '1px',
    '--ui-shadow': isDark ? '0 20px 50px rgba(0,0,0,0.85)' : '0 20px 50px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px',
    color: 'var(--color-foreground)',
    background: 'var(--color-surface)',
    border: 'var(--border-weight) solid var(--color-border)',
    boxShadow: 'var(--ui-shadow)',
  } as React.CSSProperties;

  const inputClass = `w-full bg-transparent border-b border-border py-2 text-[10px] sm:text-xs font-[family-name:var(--font-primary)] focus:outline-none focus:border-primary transition-colors placeholder:opacity-30`;

  return (
    <div className={`fixed z-[200] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
      isScrolled ? 'right-6 top-1/2 -translate-y-1/2' : 'top-20 right-6'
    }`}>
      <div
        className={`w-full sm:w-[600px] md:w-[700px] h-[85vh] max-h-[800px] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen 
            ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto' 
            : `opacity-0 scale-95 pointer-events-none absolute ${isScrolled ? 'translate-x-8 translate-y-0' : 'translate-x-0 -translate-y-8'}`
        }`}
        style={{
          ...minimalDashboardStyles,
          transformOrigin: isScrolled ? 'right center' : 'top right'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: 'var(--color-surface-high)',
            borderBottom: 'var(--border-weight) solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest text-foreground">
              EDIT PROFILE
            </span>
            {formData.handle && (
              <a 
                href={`/profile/${formData.handle}?theme=minimal`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-primary)] text-[10px] uppercase font-bold tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
              >
                VIEW PROFILE <ExternalLink size={10} />
              </a>
            )}
          </div>
          <button
            onClick={() => closeProfile()}
            className="transition-colors"
            style={{ color: 'var(--color-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain minimal-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin text-secondary" size={24} />
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSubmit} className="flex flex-col gap-8 pb-10">
              
              {/* Core Identity */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-border pb-2">Core Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Display Name</label>
                    <input name="displayName" value={formData.displayName} onChange={handleChange} className={inputClass} placeholder="Your Name" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Location / Timezone</label>
                    <div className="flex gap-2">
                      <input name="location" value={formData.location} onChange={handleChange} className={inputClass} placeholder="Tokyo, Japan" />
                      <input name="timezone" value={formData.timezone} onChange={handleChange} className={`w-20 shrink-0 ${inputClass}`} placeholder="JST" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} className={`${inputClass} resize-none`} rows={2} placeholder="Who are you?" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Banner Background</label>
                  <div className="relative flex items-center w-full">
                    <div className="absolute left-0 w-4 h-4 rounded-full overflow-hidden border border-border shadow-sm group">
                      <input 
                        type="color" 
                        name="bannerUrl"
                        value={formData.bannerUrl?.startsWith('#') ? formData.bannerUrl.substring(0, 7) : '#000000'} 
                        onChange={handleChange}
                        className="absolute -top-4 -left-4 w-12 h-12 cursor-pointer opacity-0 z-10"
                        title="Choose a color"
                      />
                      <div 
                        className="absolute inset-0 group-hover:scale-110 transition-transform" 
                        style={{ background: formData.bannerUrl?.startsWith('#') ? formData.bannerUrl : 'var(--color-surface-high)' }}
                      />
                    </div>
                    <input 
                      name="bannerUrl" 
                      value={formData.bannerUrl} 
                      onChange={handleChange} 
                      className={`${inputClass} pl-7`} 
                      placeholder="Paste image URL or pick color..." 
                    />
                  </div>
                </div>
              </div>

              {/* The Grind */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-border pb-2">The Grind</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Current Grind</label>
                    <input name="currentGrind" value={formData.currentGrind} onChange={handleChange} className={inputClass} placeholder="e.g. Studying for finals" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">What I'm Building</label>
                    <input name="whatImBuilding" value={formData.whatImBuilding} onChange={handleChange} className={inputClass} placeholder="e.g. A new SaaS startup" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Active Goals (comma separated)</label>
                    <input name="activeGoals" value={formData.activeGoals} onChange={handleChange} className={inputClass} placeholder="Read 10 books, Get a job" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Tech Stack / Tools</label>
                    <input name="programmingTools" value={formData.programmingTools} onChange={handleChange} className={inputClass} placeholder="React, Node.js, Python" />
                  </div>
                </div>
              </div>

              {/* Vibe & Setup */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-border pb-2">Vibe & Setup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Current Mood</label>
                    <input name="currentMood" value={formData.currentMood} onChange={handleChange} className={inputClass} placeholder="e.g. Deep focus, Chill" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Favorite Music</label>
                    <input name="favoriteMusic" value={formData.favoriteMusic} onChange={handleChange} className={inputClass} placeholder="e.g. Lo-fi beats, Synthwave" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Deep Work Hours</label>
                    <input name="deepWorkHours" value={formData.deepWorkHours} onChange={handleChange} className={inputClass} placeholder="e.g. Night Owl (11PM - 3AM)" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Setup Details</label>
                    <input name="setupDetails" value={formData.setupDetails} onChange={handleChange} className={inputClass} placeholder="e.g. MacBook Pro + Mechanical Keyboard" />
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-border pb-2">Socials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Twitter / X</label>
                    <input name="twitter" value={formData.twitter} onChange={handleChange} className={inputClass} placeholder="@username" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">GitHub</label>
                    <input name="github" value={formData.github} onChange={handleChange} className={inputClass} placeholder="username" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} className={inputClass} placeholder="username" />
                  </div>
                  {customLinks.map((link, idx) => (
                    <div key={idx} className="flex flex-col col-span-1 sm:col-span-3 sm:flex-row gap-3 items-end">
                      <div className="flex flex-col w-full sm:w-1/3">
                        <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Platform</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdownIndex(openDropdownIndex === idx ? null : idx);
                            }}
                            className={`${inputClass} flex items-center justify-between text-left`}
                          >
                            <span>{link.platform}</span>
                            <ChevronDown size={14} className="text-secondary" />
                          </button>
                          
                          <AnimatePresence>
                            {openDropdownIndex === idx && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                  className={`absolute left-0 top-full mt-1 z-50 min-w-[150px] p-[5px] rounded-[10px] border backdrop-blur-[24px] shadow-2xl flex flex-col gap-[2px] ${isDark ? 'bg-[#28282b]/90 border-white/10 shadow-black/50' : 'bg-white/90 border-black/10 shadow-black/10'}`}
                                >
                                  {['LinkedIn', 'YouTube', 'TikTok', 'Twitch', 'Dribbble', 'Behance', 'Discord', 'Website'].map((platform) => (
                                    <button
                                      key={platform}
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newLinks = [...customLinks];
                                        newLinks[idx].platform = platform;
                                        setCustomLinks(newLinks);
                                        setOpenDropdownIndex(null);
                                      }}
                                      className={`w-full text-left px-2 py-[5px] text-[13px] font-medium rounded-[5px] transition-colors ${
                                        link.platform === platform 
                                          ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                                          : (isDark ? 'text-[#e5e5e5] hover:bg-[#0058d0] hover:text-white' : 'text-[#2b2b2b] hover:bg-[#0058d0] hover:text-white')
                                      }`}
                                    >
                                      {platform}
                                    </button>
                                  ))}
                                </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 w-full">
                        <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Handle / URL</label>
                        <div className="flex gap-2 items-center">
                          <input
                            value={link.handle}
                            onChange={(e) => {
                              const newLinks = [...customLinks];
                              newLinks[idx].handle = e.target.value;
                              setCustomLinks(newLinks);
                            }}
                            className={inputClass}
                            placeholder="@handle or https://"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLinks(customLinks.filter((_, i) => i !== idx));
                            }}
                            className="p-2 text-secondary hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-1 sm:col-span-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setCustomLinks([...customLinks, { platform: 'LinkedIn', handle: '' }])}
                      className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-border rounded-xl text-secondary hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Plus size={14} /> Add Social Link
                    </button>
                  </div>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 shrink-0 flex justify-end"
          style={{
            borderTop: 'var(--border-weight) solid var(--color-border)',
            background: 'var(--color-surface-high)',
          }}
        >
          <button
            type="submit"
            form="profile-form"
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
