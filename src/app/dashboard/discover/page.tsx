import prisma from '@/lib/prisma';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { Bookmark } from 'lucide-react';
import { toggleSaveRoom } from '@/app/actions/room-actions';

export default async function DiscoverPage() {
  const user = await currentUser();
  const userId = user?.id;

  const publicRooms = await prisma.room.findMany({
    where: {
      visibility: 'PUBLIC',
      OR: [
        { temporary: false },
        { AND: [{ temporary: true }, { creatorId: userId || '' }] }
      ]
    },
    include: {
      savedBy: userId ? {
        where: { id: userId }
      } : false,
      participants: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-10 py-8 border-b border-border bg-surface sticky top-0 z-10 flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-primary)] font-bold text-3xl tracking-tight text-foreground uppercase">Discover</h1>
        <p className="font-[family-name:var(--font-primary)] text-sm text-secondary">Find global study rooms and co-working spaces.</p>
      </header>

      <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicRooms.map((room) => (
          <div key={room.id} className="border border-border bg-surface p-6 flex flex-col gap-4 transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-primary)] font-semibold text-lg text-foreground">{room.name}</h2>
                <span className="font-[family-name:var(--font-primary)] text-xs text-secondary">{room.subject} • {room.vibe}</span>
              </div>
              <div className="flex items-center gap-2">
                {room.password && (
                  <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase border border-border px-2 py-1 text-primary">
                    LOCKED
                  </span>
                )}
                {userId && (
                  <form action={toggleSaveRoom}>
                    <input type="hidden" name="roomId" value={room.id} />
                    <button type="submit" className="text-secondary hover:text-primary transition-colors">
                      <Bookmark size={18} className={(room.savedBy && room.savedBy.length > 0) ? 'fill-primary text-primary' : ''} />
                    </button>
                  </form>
                )}
              </div>
            </div>
            <div className="font-[family-name:var(--font-primary)] text-xs flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 ${room.participants && room.participants.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                <span className="text-secondary">PEOPLE:</span>
                <span className="text-foreground font-bold">
                  {String(room.participants?.length || 0).padStart(2, '0')} / {String(room.capacity).padStart(2, '0')}
                </span>
              </div>
              {room.isDefaultRoom && <span className="text-primary">★ Official</span>}
            </div>
            
            <Link 
              href={`/room/${room.slug}/lobby`}
              className="mt-auto block w-full border border-border text-center py-2 font-[family-name:var(--font-primary)] text-xs uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              Enter Room
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
