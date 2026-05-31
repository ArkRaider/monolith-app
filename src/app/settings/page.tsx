import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/app/actions/user-actions';

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-4xl mt-12 mx-auto pb-24">
      <h1 className="text-4xl font-[family-name:var(--font-primary)] font-black tracking-tighter uppercase mb-2 text-foreground">Identity Terminal</h1>
      <p className="text-secondary font-[family-name:var(--font-primary)] text-sm mb-12 uppercase tracking-widest border-b-2 border-border pb-4">
        Configure your social presence and state matrix.
      </p>

      <form action={updateProfile} className="space-y-8">
        
        {/* Banner Section */}
        <div className="border-[length:var(--border-weight)] border-border bg-surface overflow-hidden relative group">
          {dbUser.bannerUrl ? (
            <img src={dbUser.bannerUrl} alt="Banner" className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-surface-container opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 2px, transparent 2px, transparent 14px)' }}></div>
          )}
          <div className="absolute top-4 right-4 bg-background border-[length:var(--border-weight)] border-border p-2 z-10">
            <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">Banner Image URL</label>
            <input 
              type="text" 
              name="bannerUrl"
              defaultValue={dbUser.bannerUrl || ''} 
              placeholder="https://..."
              className="w-full bg-surface border border-border p-1 font-[family-name:var(--font-primary)] text-xs focus:border-primary focus:outline-none transition-colors text-foreground min-w-[250px]"
            />
          </div>
          <div className="absolute bottom-4 left-4 bg-background border-[length:var(--border-weight)] border-border p-4 shadow-[var(--ui-shadow)]">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold block mb-2">Display Name</label>
            <input 
              type="text" 
              name="displayName"
              defaultValue={dbUser.displayName} 
              className="bg-surface border border-border p-2 font-[family-name:var(--font-primary)] text-2xl font-black focus:border-primary focus:outline-none transition-colors text-foreground uppercase tracking-tight"
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Status & Bio */}
          <div className="space-y-8">
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-6 shadow-[var(--ui-shadow)]">
              <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold block mb-4 border-b-2 border-border pb-2">Status Matrix</label>
              
              <div className="space-y-6">
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Current Grind</label>
                  <input 
                    type="text" 
                    name="currentGrind"
                    defaultValue={dbUser.currentGrind || ''} 
                    placeholder="e.g. Deep Study Mode"
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>

                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Extended Bio</label>
                  <textarea 
                    name="bio"
                    defaultValue={dbUser.bio || ''} 
                    rows={4}
                    placeholder="Document your journey..."
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors resize-none text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Arrays */}
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-6">
              <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold block mb-4 border-b-2 border-border pb-2">Skill Trees</label>
              
              <div className="space-y-6">
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Programming Tools / Languages (Comma Separated)</label>
                  <textarea 
                    name="programmingTools"
                    defaultValue={dbUser.programmingTools?.join(', ') || ''} 
                    rows={3}
                    placeholder="React, Python, Figma..."
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>

                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Active Goals (Comma Separated)</label>
                  <textarea 
                    name="activeGoals"
                    defaultValue={dbUser.activeGoals?.join(', ') || ''} 
                    rows={3}
                    placeholder="Finish thesis, Build app..."
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Socials */}
          <div className="space-y-8">
            <div className="border-[length:var(--border-weight)] border-border bg-surface p-6">
              <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-primary font-bold block mb-4 border-b-2 border-border pb-2">Social Hub</label>
              
              <div className="space-y-6">
                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">GitHub</label>
                  <input 
                    type="text" 
                    name="github"
                    defaultValue={dbUser.github || ''} 
                    placeholder="@username"
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>

                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Twitter / X</label>
                  <input 
                    type="text" 
                    name="twitter"
                    defaultValue={dbUser.twitter || ''} 
                    placeholder="@username"
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>

                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Instagram</label>
                  <input 
                    type="text" 
                    name="instagram"
                    defaultValue={dbUser.instagram || ''} 
                    placeholder="@username"
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>

                <div>
                  <label className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">Custom Links (Comma Separated)</label>
                  <textarea 
                    name="customLinks"
                    defaultValue={dbUser.customLinks?.join(', ') || ''} 
                    rows={4}
                    placeholder="https://portfolio.com, https://blog.com..."
                    className="w-full bg-background border-[length:var(--border-weight)] border-border p-3 font-[family-name:var(--font-primary)] text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full p-6 border-[length:var(--border-weight)] border-border bg-primary text-primary-foreground font-[family-name:var(--font-primary)] font-black text-xl uppercase tracking-widest hover:bg-border-hover active:scale-[0.98] transition-all shadow-[var(--ui-shadow)]"
            >
              INITIALIZE IDENTITY
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
