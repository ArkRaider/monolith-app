import { getUserProfile } from '@/app/actions/user-actions';
import { getUserStudyGrid } from '@/app/actions/gamification-actions';
import { calculateLevel } from '@/lib/title-calculator';
import { getUserTitle } from '@/lib/title-calculator';
import { notFound } from 'next/navigation';
import { ExternalLink, Terminal } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ handle: string }>;
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

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getUserProfile(handle);

  if (!profile || 'error' in profile) {
    notFound();
  }

  const studyGrid = await getUserStudyGrid(profile.id);
  const totalMinutes = studyGrid.reduce((sum, d) => sum + d.minutesStudied, 0);
  const { level } = calculateLevel(profile.xp);
  const title = getUserTitle(totalMinutes);

  return (
    <div className="w-full max-w-5xl mt-12 mx-auto pb-24 text-foreground px-4 md:px-0">
      
      {/* Header / Banner Segment */}
      <div className="border-[length:var(--border-weight)] border-border bg-surface relative mb-8">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-48 md:h-64 object-cover" />
        ) : (
          <div className="w-full h-48 md:h-64 bg-surface-container opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 2px, transparent 2px, transparent 14px)' }}></div>
        )}
        
        <div className="absolute top-4 left-4 bg-background border-[length:var(--border-weight)] border-border px-3 py-1 font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-black shadow-[var(--ui-shadow)]">
          [IDENTITY_RECORD]
        </div>

        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
            <div className="w-24 h-24 bg-background border-[length:var(--border-weight)] border-border shadow-[var(--ui-shadow)] flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-[family-name:var(--font-primary)] text-3xl font-black text-secondary">{profile.handle.substring(0, 2).toUpperCase()}</span>
                )}
            </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Status */}
        <div className="md:col-span-1 space-y-8">
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-6 shadow-[var(--ui-shadow)]">
                <h1 className="text-3xl font-[family-name:var(--font-primary)] font-black uppercase tracking-tighter text-foreground mb-1">
                    {profile.displayName}
                </h1>
                <p className="font-[family-name:var(--font-primary)] text-xs text-secondary mb-4 uppercase tracking-widest">@{profile.handle}</p>
                
                <div className="border-t-[length:var(--border-weight)] border-border pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal size={14} className="text-primary" />
                        <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold">Current Rank</span>
                    </div>
                    <div className="font-[family-name:var(--font-primary)]">
                        <span className="text-2xl font-black text-foreground">LVL {level}</span>
                        <span className="text-xs text-secondary ml-2 uppercase tracking-widest">{"//"} {title}</span>
                    </div>
                </div>

                <div className="border-t-[length:var(--border-weight)] border-border pt-4 mt-4">
                    <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Status Matrix</div>
                    {profile.currentGrind ? (
                        <p className="font-[family-name:var(--font-primary)] text-xs text-foreground border border-border px-2 py-1 bg-background inline-block uppercase tracking-widest">
                            {profile.currentGrind}
                        </p>
                    ) : (
                        <p className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
                            {'[OFFLINE]'}
                        </p>
                    )}
                </div>
            </div>

            {/* Social Hub */}
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-6">
                <div className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-4 border-b-2 border-border pb-2">Social Hub</div>
                {(profile.instagram || profile.twitter || profile.github || profile.customLinks.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {sanitizeSocialLink(profile.instagram || '', 'instagram') && (
                        <a href={sanitizeSocialLink(profile.instagram || '', 'instagram')!} target="_blank" rel="noopener noreferrer" className="p-2 border border-border bg-background text-secondary hover:text-foreground transition-colors hover:border-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </a>
                      )}
                      {sanitizeSocialLink(profile.twitter || '', 'twitter') && (
                        <a href={sanitizeSocialLink(profile.twitter || '', 'twitter')!} target="_blank" rel="noopener noreferrer" className="p-2 border border-border bg-background text-secondary hover:text-foreground transition-colors hover:border-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        </a>
                      )}
                      {sanitizeSocialLink(profile.github || '', 'github') && (
                        <a href={sanitizeSocialLink(profile.github || '', 'github')!} target="_blank" rel="noopener noreferrer" className="p-2 border border-border bg-background text-secondary hover:text-foreground transition-colors hover:border-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                        </a>
                      )}
                      {profile.customLinks.map((link, idx) => {
                         try {
                           new URL(link);
                           return (
                             <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="p-2 border border-border bg-background text-secondary hover:text-foreground transition-colors hover:border-primary">
                               <ExternalLink size={16} />
                             </a>
                           );
                         } catch {
                           return null;
                         }
                      })}
                    </div>
                  ) : (
                    <p className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
                      [SOCIAL_UNCONFIGURED_BY_USER]
                    </p>
                  )}
            </div>
        </div>

        {/* Right Column: Content & Activity */}
        <div className="md:col-span-2 space-y-8">
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-8 shadow-[var(--ui-shadow)]">
                <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-4 border-b-2 border-border pb-2">Extended Bio</h2>
                {profile.bio ? (
                    <p className="font-[family-name:var(--font-primary)] text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
                        {profile.bio}
                    </p>
                ) : (
                    <p className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
                        [NO_BIOGRAPHY_PROVIDED]
                    </p>
                )}
            </div>

            <div className="border-[length:var(--border-weight)] border-border bg-surface p-8">
                <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-4 border-b-2 border-border pb-2">Skill Trees</h2>
                {(profile.programmingTools.length > 0 || profile.activeGoals.length > 0) ? (
                    <div className="space-y-6">
                        {profile.programmingTools.length > 0 && (
                            <div>
                                <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Tools / Languages</div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.programmingTools.map(tool => (
                                    <span key={tool} className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-wider text-secondary bg-background border border-border px-2 py-1">
                                        {tool}
                                    </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {profile.activeGoals.length > 0 && (
                            <div>
                                <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Active Objectives</div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.activeGoals.map(goal => (
                                    <span key={goal} className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-wider text-foreground bg-primary/10 border border-primary px-2 py-1">
                                        {goal}
                                    </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="font-[family-name:var(--font-primary)] text-[10px] text-secondary">
                        [NO_SKILLS_CONFIGURED]
                    </p>
                )}
            </div>

            {/* Activity Grid */}
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-8 shadow-[var(--ui-shadow)]">
                <h2 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold mb-4 border-b-2 border-border pb-2">140-Day Activity Matrix</h2>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 140 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (139 - i));
                      const dateStr = d.toISOString().split('T')[0];
                      const activity = studyGrid.find(a => a.date === dateStr);
                      const isActive = activity && activity.minutesStudied >= 45;
                      const intensity = activity ? (activity.minutesStudied >= 120 ? 'bg-primary' : activity.minutesStudied >= 45 ? 'bg-primary/60' : 'bg-primary/30') : 'bg-secondary/10';
                      
                      return (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-[var(--radius)] transition-colors hover:ring-1 hover:ring-foreground cursor-crosshair ${intensity}`}
                          title={`${dateStr}${activity ? `: ${activity.minutesStudied} mins` : ': No Data'}`}
                        />
                      );
                    })}
                </div>
            </div>
            
        </div>
      </div>
    </div>
  );
}
