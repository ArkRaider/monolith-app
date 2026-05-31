'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, capacity })
      });

      if (res.ok) {
        const room = await res.json();
        onClose();
        router.push(`/room/${room.slug}`);
      } else {
        console.error('Failed to create room');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border-[length:var(--border-weight)] border-border w-full max-w-md p-8 flex flex-col shadow-[var(--ui-shadow)] rounded-[var(--radius)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 font-[family-name:var(--font-primary)] text-secondary hover:text-foreground">
          [X]
        </button>
        
        <h2 className="font-[family-name:var(--font-primary)] font-semibold text-xl mb-8 tracking-tight text-foreground">CREATE ROOM</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Room Name</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-surface border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border" 
              placeholder="e.g. Deep Focus"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Subject</label>
            <input 
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="bg-surface border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground placeholder:text-border" 
              placeholder="e.g. Engineering"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest text-secondary">Capacity (Max 50)</label>
            <input 
              required
              type="number"
              min="2"
              max="50"
              value={capacity}
              onChange={e => setCapacity(parseInt(e.target.value))}
              className="bg-surface border border-border px-4 py-3 text-sm font-[family-name:var(--font-primary)] focus:border-primary outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center p-4 mt-6 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-transform duration-120 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'CREATING...' : '+ LAUNCH ROOM'}
          </button>
        </form>
      </div>
    </div>
  );
}
