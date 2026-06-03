'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { X, Save, RefreshCw } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useNotification } from '@/context/NotificationContext';
import { getMyProfile, updateProfile } from '@/app/actions/user-actions';

export default function ProfileWidget() {
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
    currentGrind: '',
    programmingTools: '',
    activeGoals: '',
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { profile, error } = await getMyProfile();
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        handle: profile.handle || '',
        bio: profile.bio || '',
        currentGrind: profile.currentGrind || '',
        programmingTools: profile.programmingTools?.join(', ') || '',
        activeGoals: profile.activeGoals?.join(', ') || '',
      });
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
      fd.append(key, value);
    });

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
    <div className={`fixed z-[200] right-6 top-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none`}>
      <div
        className={`w-[340px] h-[550px] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 translate-x-8 pointer-events-none absolute'}`}
        style={minimalDashboardStyles}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: 'var(--color-surface-high)',
            borderBottom: 'var(--border-weight) solid var(--color-border)',
          }}
        >
          <span className="font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest text-foreground">
            EDIT PROFILE
          </span>
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
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin text-secondary" size={24} />
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Display Name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Your Name"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Who are you?"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Current Grind</label>
                <input
                  name="currentGrind"
                  value={formData.currentGrind}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Studying for finals, Building a startup"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Programming Tools</label>
                <input
                  name="programmingTools"
                  value={formData.programmingTools}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="React, Node.js, Python (comma separated)"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest font-black text-secondary mb-1">Active Goals</label>
                <input
                  name="activeGoals"
                  value={formData.activeGoals}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Read 10 books, Get a job (comma separated)"
                />
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
