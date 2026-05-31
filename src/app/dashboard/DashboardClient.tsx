'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';

interface Room {
  id: string;
  slug: string;
  name: string;
  subject: string;
  capacity: number;
  vibe: string | null;
  visibility: string;
  creatorName: string;
  participantCount: number;
  isCurated: boolean;
  isSaved?: boolean;
}
export function DashboardClient({ initialRooms, clerkId }: { initialRooms: Room[], clerkId?: string }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [liveHeadcounts, setLiveHeadcounts] = useState<Record<string, number>>({});

  // Global headcount socket
  useEffect(() => {
    let active = true;
    const socket = io('http://127.0.0.1:3001', { transports: ['websocket'] });
    socket.on('global-headcount-update', ({ roomId, liveCount }) => {
      if (!active) return;
      setLiveHeadcounts(prev => ({ ...prev, [roomId]: liveCount }));
    });
    return () => {
      active = false;
      if (socket.connected) { socket.disconnect(); } else { setTimeout(() => socket.disconnect(), 500); }
    };
  }, []);

  return (
    <div className="bg-background min-h-screen text-foreground flex w-full">


      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-primary)]">MONOLITH // STUDIOS</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const currentCount = liveHeadcounts[room.slug] !== undefined
                ? liveHeadcounts[room.slug]
                : room.participantCount;

              return (
                <div
                  key={room.id}
                  className="border border-border bg-surface p-6 flex flex-col justify-between transition-colors hover:border-primary"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold tracking-tight">{room.name}</h3>
                      <div className="flex items-center gap-2">
                        {room.isCurated && (
                          <span className="text-[9px] font-[family-name:var(--font-primary)] border border-primary px-1 text-primary uppercase">CURATED</span>
                        )}
                        <button
                          className="text-secondary hover:text-primary transition-colors focus:outline-none"
                        >
                          <Bookmark size={18} className={room.isSaved ? 'fill-primary text-primary' : 'text-secondary'} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-[family-name:var(--font-primary)] text-secondary mt-1">/room/{room.slug}</p>
                    <div className="mt-2 text-xs text-secondary font-[family-name:var(--font-primary)]">Subject: {room.subject}</div>
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-4 border-t border-border">
                    <div className="font-[family-name:var(--font-primary)] text-xs flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 ${currentCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                      <span className="text-secondary">PEOPLE:</span>
                      <span className="text-foreground font-bold">
                        {String(currentCount).padStart(2, '0')} / {String(room.capacity).padStart(2, '0')}
                      </span>
                    </div>

                    <Link
                      href={`/room/${room.slug}/studio`}
                      className="bg-foreground text-background px-3 py-1 text-xs font-[family-name:var(--font-primary)] font-bold uppercase hover:bg-primary hover:text-background transition-colors"
                    >
                      Connect //
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}