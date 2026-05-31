'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRoomAction } from '@/app/actions/room-actions';

export default function CreateRoomPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [vibe, setVibe] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [allowMic, setAllowMic] = useState(true);
  const [allowCam, setAllowCam] = useState(true);
  const [globalChatEnabled, setGlobalChatEnabled] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const { slug } = await createRoomAction({
          name,
          subject,
          capacity,
          vibe,
          visibility,
          password: visibility === 'PRIVATE' ? password : '',
          allowMic,
          allowCam,
          globalChatEnabled
        });
        router.push(`/room/${slug}/lobby`);
      } catch (err) {
        console.error('Failed to create room', err);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8">
      <div className="bg-surface border border-border p-8 flex flex-col shadow-[var(--ui-shadow)]">
        <h2 className="font-[family-name:var(--font-primary)] font-bold text-2xl tracking-tight text-foreground uppercase mb-8 border-b border-border pb-4">
          Create New Room
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Room Name *</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-background border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border transition-colors" 
              placeholder="e.g. Deep Focus"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Subject *</label>
            <input 
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="bg-background border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border transition-colors" 
              placeholder="e.g. Engineering"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Capacity *</label>
              <input 
                required
                type="number"
                min="2"
                max="50"
                value={capacity}
                onChange={e => setCapacity(parseInt(e.target.value))}
                className="bg-background border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Vibe (Optional)</label>
              <input 
                value={vibe}
                onChange={e => setVibe(e.target.value)}
                className="bg-background border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border transition-colors" 
                placeholder="e.g. Chill Lo-Fi"
              />
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-2">
            <h3 className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary mb-4">Security & Hardware</h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-foreground">Visibility</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setVisibility('PUBLIC')}
                    className={`flex-1 py-3 border text-sm font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${visibility === 'PUBLIC' ? 'bg-primary border-primary text-primary-foreground' : 'bg-surface border-border text-secondary hover:text-foreground'}`}
                  >
                    PUBLIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('PRIVATE')}
                    className={`flex-1 py-3 border text-sm font-[family-name:var(--font-primary)] font-bold uppercase transition-colors ${visibility === 'PRIVATE' ? 'bg-primary border-primary text-primary-foreground' : 'bg-surface border-border text-secondary hover:text-foreground'}`}
                  >
                    PRIVATE
                  </button>
                </div>
              </div>

              {visibility === 'PRIVATE' && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Password *</label>
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-background border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border transition-colors" 
                    placeholder="Enter strict password"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowMic} 
                    onChange={e => setAllowMic(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="font-[family-name:var(--font-primary)] text-sm text-foreground">Allow Microphones</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowCam} 
                    onChange={e => setAllowCam(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="font-[family-name:var(--font-primary)] text-sm text-foreground">Allow Cameras</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={globalChatEnabled} 
                    onChange={e => setGlobalChatEnabled(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="font-[family-name:var(--font-primary)] text-sm text-foreground">Enable Global Chat</span>
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full flex items-center justify-center p-4 mt-4 bg-foreground text-background font-[family-name:var(--font-primary)] font-bold text-sm tracking-widest uppercase hover:bg-primary hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isPending ? 'DEPLOYING...' : '+ LAUNCH ROOM'}
          </button>
        </form>
      </div>
    </div>
  );
}
