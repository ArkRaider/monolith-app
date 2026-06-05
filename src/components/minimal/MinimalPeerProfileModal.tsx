'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, Clock, Coffee, Music, Code, Target, MapPin, Globe, Loader2, UserPlus, Mail, Twitter, Github, Instagram, Timer, Linkedin, Youtube, Twitch, Dribbble } from 'lucide-react';

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin': return <Linkedin size={14} className="text-white" />;
    case 'youtube': return <Youtube size={14} className="text-white" />;
    case 'tiktok': return <Music size={14} className="text-white" />;
    case 'twitch': return <Twitch size={14} className="text-white" />;
    case 'dribbble': return <Dribbble size={14} className="text-white" />;
    default: return <Globe size={14} className="text-white" />;
  }
};
import { getUserProfile } from '@/app/actions/user-actions';
import { calculateLevel } from '@/lib/title-calculator';
import Link from 'next/link';

interface UserProfileData {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  instagram: string | null;
  twitter: string | null;
  github: string | null;
  bannerUrl: string | null;
  currentGrind: string | null;
  whatImBuilding: string | null;
  programmingTools: string[];
  activeGoals: string[];
  customLinks: string[];
  xp: number;
  
  location: string | null;
  timezone: string | null;
  currentMood: string | null;
  favoriteMusic: string | null;
  deepWorkHours: string | null;
  coffeePreference: string | null;
  portfolioUrl: string | null;
  setupDetails: string | null;
  lastActive: Date | string | null;
}

interface MinimalPeerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  isDark: boolean;
}

export function MinimalPeerProfileModal({ isOpen, onClose, handle, isDark }: MinimalPeerProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState('NONE');

  useEffect(() => {
    if (isOpen && handle) {
      const loadProfile = async () => {
        setLoading(true);
        try {
          const data = await getUserProfile(handle);
          if (data && !('error' in data)) {
            setProfile(data as unknown as UserProfileData);
            
            const { getFriendshipStatus } = await import('@/app/actions/friend-actions');
            const status = await getFriendshipStatus(data.id);
            setFriendshipStatus(status);
          }
        } catch (error) {
          console.error("Failed to load peer profile:", error);
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [isOpen, handle]);

  const handleAddFriend = async () => {
    if (!profile || friendshipStatus !== 'NONE') return;
    setFriendshipStatus('PENDING_SENT');
    const { sendFriendRequest } = await import('@/app/actions/friend-actions');
    const res = await sendFriendRequest(profile.id);
    if (res.error) setFriendshipStatus('NONE');
  };

  const themeClasses = {
    bg: isDark ? 'bg-transparent' : 'bg-transparent',
    panel: isDark 
      ? 'bg-[#1c1c1e]/80 border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.5)]' 
      : 'bg-[#f4f5f5]/80 border-black/10 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_30px_60px_rgba(0,0,0,0.2)]',
    text: isDark ? 'text-white/90' : 'text-black/90',
    textMuted: isDark ? 'text-white/60' : 'text-black/60',
    textSubtle: isDark ? 'text-white/40' : 'text-black/40',
    border: isDark ? 'border-white/10' : 'border-black/10',
    cardBg: isDark ? 'bg-[#2c2c2e]/50 backdrop-blur-xl border border-white/5' : 'bg-white/50 backdrop-blur-xl border border-black/5',
    accentBg: isDark ? 'bg-[#007AFF]' : 'bg-[#007AFF]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 backdrop-blur-[2px] transition-colors ${isDark ? 'bg-black/40' : 'bg-white/40'}`}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[20px] backdrop-blur-[40px] flex flex-col ${themeClasses.panel}`}
          >
            {/* macOS Title Bar */}
            <div className={`h-12 w-full flex items-center justify-between px-4 shrink-0 border-b ${themeClasses.border}`}>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose}
                  className="w-[14px] h-[14px] rounded-full bg-[#ff5f56] flex items-center justify-center group hover:bg-[#ff5f56]/90 transition-colors"
                >
                  <X size={8} className="opacity-0 group-hover:opacity-100 text-black/50" />
                </button>
                <div className="w-[14px] h-[14px] rounded-full bg-[#ffbd2e]" />
                <div className="w-[14px] h-[14px] rounded-full bg-[#27c93f]" />
              </div>
              <div className={`text-[13px] font-medium tracking-wide ${themeClasses.text}`}>
                Profile Preview
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Header / Banner Area (Mac styled) */}
            <div className="relative shrink-0 p-6 flex items-end gap-6">
              <div className="absolute right-6 top-6 flex items-center gap-2 z-20">
                {profile?.twitter && (
                  <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                    <Twitter size={14} className="text-white" />
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                    <Github size={14} className="text-white" />
                  </a>
                )}
                {profile?.instagram && (
                  <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                    <Instagram size={14} className="text-white" />
                  </a>
                )}
                {profile?.customLinks && profile.customLinks.map((linkStr, idx) => {
                  const [platform, ...handleParts] = linkStr.split('|');
                  const handle = handleParts.join('|');
                  if (!handle) return null;
                  
                  let url = handle;
                  if (!url.startsWith('http')) {
                    if (platform === 'LinkedIn') url = `https://linkedin.com/in/${handle}`;
                    else if (platform === 'YouTube') url = `https://youtube.com/${handle.startsWith('@') ? handle : '@' + handle}`;
                    else if (platform === 'TikTok') url = `https://tiktok.com/@${handle.replace('@', '')}`;
                    else if (platform === 'Twitch') url = `https://twitch.tv/${handle}`;
                    else if (platform === 'Dribbble') url = `https://dribbble.com/${handle}`;
                    else if (platform === 'Behance') url = `https://behance.net/${handle}`;
                    else url = `https://${handle}`;
                  }
                  
                  return (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" title={platform} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
                      {getSocialIcon(platform)}
                    </a>
                  );
                })}
              </div>
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none opacity-30"
                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 90%)', maskImage: 'linear-gradient(to bottom, black 0%, transparent 90%)' }}
              >
                {profile?.bannerUrl && (
                  profile.bannerUrl.startsWith('#') || profile.bannerUrl.startsWith('rgb') || profile.bannerUrl.startsWith('hsl') ? (
                    <div className="w-full h-full scale-110" style={{ backgroundColor: profile.bannerUrl, filter: 'blur(40px)' }} />
                  ) : (
                    <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover blur-3xl scale-110" />
                  )
                )}
              </div>
              
              <div className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-white/20 shadow-2xl ${isDark ? 'bg-[#1c1c1e]' : 'bg-[#e5e5e5]'}`}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-4xl font-bold">
                    {handle.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="relative z-10 pb-2">
                <h2 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${themeClasses.text}`}>
                  {profile?.displayName || handle}
                </h2>
                <div className={`flex items-center gap-3 mt-1 ${themeClasses.textMuted}`}>
                  <span className="text-[13px] font-medium">@{handle}</span>
                  {profile && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                      <span className="flex items-center gap-1.5 text-[13px] font-medium opacity-80">
                        <Timer size={12} />
                        {Math.max(1, Math.floor((Date.now() - new Date(profile.lastActive || Date.now()).getTime()) / 60000))}m in room
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className={`flex-1 overflow-y-auto px-6 pt-2 pb-6 minimal-scrollbar ${themeClasses.bg}`}
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)' }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-50">
                  <Loader2 size={24} className="animate-spin mb-4" />
                  <p className="text-[13px] font-medium">Fetching details...</p>
                </div>
              ) : profile ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Details */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    
                    {profile.bio && (
                      <div className={`p-4 rounded-[12px] ${themeClasses.cardBg}`}>
                        <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${themeClasses.textSubtle}`}>About</h3>
                        <p className={`text-[13px] leading-relaxed ${themeClasses.textMuted}`}>
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    <div className={`p-4 rounded-[12px] flex flex-col gap-3 ${themeClasses.cardBg}`}>
                      {profile.location && (
                        <div className="flex items-center gap-3">
                          <MapPin size={14} className={themeClasses.textSubtle} />
                          <div className={`text-[13px] ${themeClasses.text}`}>{profile.location}</div>
                        </div>
                      )}
                      
                      {profile.timezone && (
                        <div className="flex items-center gap-3">
                          <Globe size={14} className={themeClasses.textSubtle} />
                          <div className={`text-[13px] ${themeClasses.text}`}>{profile.timezone}</div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-2">
                      {friendshipStatus === 'NONE' && (
                        <button
                          onClick={handleAddFriend}
                          className="w-full py-2 rounded-[8px] bg-[#007AFF] text-white font-medium text-[13px] hover:bg-[#0058d0] transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <UserPlus size={14} /> Add Friend
                        </button>
                      )}
                      {(friendshipStatus === 'PENDING_SENT' || friendshipStatus === 'PENDING_RECEIVED' || friendshipStatus === 'ACCEPTED') && (
                        <button
                          disabled
                          className={`w-full py-2 rounded-[8px] font-medium text-[13px] flex items-center justify-center gap-2 ${themeClasses.cardBg} ${themeClasses.textSubtle}`}
                        >
                          {friendshipStatus === 'PENDING_SENT' ? 'Request Sent' : friendshipStatus === 'PENDING_RECEIVED' ? 'Check Inbox' : 'Friends ✓'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('monolith:open-dm', { detail: { handle, userId: profile.id } })
                          );
                          onClose();
                        }}
                        className={`w-full py-2 rounded-[8px] font-medium text-[13px] flex items-center justify-center gap-2 transition-colors ${themeClasses.cardBg} hover:bg-white/10 ${themeClasses.text}`}
                      >
                        <Mail size={14} /> Message
                      </button>

                      <a
                        href={`/profile/${profile.handle}?theme=minimal`}
                        target="_blank"
                        className={`w-full py-2 rounded-[8px] font-medium text-[13px] flex items-center justify-center gap-2 transition-colors ${themeClasses.cardBg} hover:bg-white/10 ${themeClasses.text}`}
                      >
                        <ExternalLink size={14} /> View Full Profile
                      </a>
                    </div>
                  </div>

                  {/* Right Column - Widgets */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.currentGrind && (
                        <div className={`p-4 rounded-[12px] flex flex-col gap-1 ${themeClasses.cardBg}`}>
                          <div className={`flex items-center gap-2 mb-1`}>
                            <Activity size={14} className="text-[#32d74b]" />
                            <div className={`text-[11px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Current Focus</div>
                          </div>
                          <div className={`text-[14px] font-medium leading-snug ${themeClasses.text}`}>{profile.currentGrind}</div>
                        </div>
                      )}
                      {profile.whatImBuilding && (
                        <div className={`p-4 rounded-[12px] flex flex-col gap-1 ${themeClasses.cardBg}`}>
                          <div className={`flex items-center gap-2 mb-1`}>
                            <Code size={14} className="text-[#0a84ff]" />
                            <div className={`text-[11px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Building</div>
                          </div>
                          <div className={`text-[14px] font-medium leading-snug ${themeClasses.text}`}>{profile.whatImBuilding}</div>
                        </div>
                      )}
                    </div>

                    {profile.programmingTools && profile.programmingTools.length > 0 && (
                      <div className={`p-4 rounded-[12px] flex flex-col gap-3 ${themeClasses.cardBg}`}>
                        <div className={`text-[11px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Toolkit</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.programmingTools.map((tool, idx) => (
                            <span key={`${tool}-${idx}`} className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium ${isDark ? 'bg-white/10 text-white/90' : 'bg-black/5 text-black/90'}`}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {profile.currentMood && (
                        <div className={`p-3 rounded-[12px] flex flex-col items-center justify-center text-center gap-1 ${themeClasses.cardBg}`}>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Mood</div>
                          <div className={`text-[13px] font-medium ${themeClasses.text}`}>{profile.currentMood}</div>
                        </div>
                      )}
                      {profile.favoriteMusic && (
                        <div className={`p-3 rounded-[12px] flex flex-col items-center justify-center text-center gap-1 ${themeClasses.cardBg}`}>
                          <Music size={14} className="text-[#bf5af2] mb-0.5" />
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Listening</div>
                          <div className={`text-[13px] font-medium truncate w-full ${themeClasses.text}`} title={profile.favoriteMusic}>{profile.favoriteMusic}</div>
                        </div>
                      )}
                      {profile.deepWorkHours && (
                        <div className={`p-3 rounded-[12px] flex flex-col items-center justify-center text-center gap-1 ${themeClasses.cardBg}`}>
                          <Clock size={14} className="text-[#64d2ff] mb-0.5" />
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Deep Work</div>
                          <div className={`text-[13px] font-medium truncate w-full ${themeClasses.text}`} title={profile.deepWorkHours}>{profile.deepWorkHours}</div>
                        </div>
                      )}
                    </div>

                    {profile.activeGoals && profile.activeGoals.length > 0 && (
                      <div className={`p-4 rounded-[12px] flex flex-col gap-2 ${themeClasses.cardBg}`}>
                        <div className={`text-[11px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Active Goals</div>
                        <ul className={`list-disc list-inside text-[13px] leading-relaxed ${themeClasses.textMuted}`}>
                          {profile.activeGoals.map((goal, idx) => (
                            <li key={`${goal}-${idx}`}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {profile.setupDetails && (
                      <div className={`p-4 rounded-[12px] flex flex-col gap-2 ${themeClasses.cardBg}`}>
                        <div className={`text-[11px] font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>Battle Station</div>
                        <p className={`text-[13px] leading-relaxed ${themeClasses.textMuted}`}>{profile.setupDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 opacity-50">
                  <p className="text-[13px] font-medium">Profile not found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
