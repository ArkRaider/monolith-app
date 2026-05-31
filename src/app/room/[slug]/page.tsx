import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function RoomPreview({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  const room = await prisma.room.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      creator: true,
      participants: true
    }
  });

  if (!room) {
    notFound();
  }

  const participantCount = room.participants.length;
  const isCurated = room.creator.handle === 'admin';
  const creatorHandle = room.creator.handle || 'Unknown';
  
  // Calculate status
  const ratio = participantCount / room.capacity;
  let status = 'OPEN';
  let statusColor = 'bg-[#4ADE80]';
  if (ratio >= 1) {
    status = 'FULL';
    statusColor = 'bg-[#EF4444]';
  } else if (ratio >= 0.8) {
    status = 'NEAR-FULL';
    statusColor = 'bg-[#F59E0B]';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      
      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <Link href="/dashboard" className="text-secondary font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest hover:text-foreground transition-colors w-fit">
            ← Back to Dashboard
          </Link>
          
          <div className="flex justify-between items-start mt-4">
            <div className="flex flex-col gap-2">
              <h1 className="font-[family-name:var(--font-primary)] font-semibold text-3xl md:text-4xl">{room.name}</h1>
              <div className="flex items-center gap-3 font-[family-name:var(--font-primary)] text-xs text-secondary tracking-wide uppercase">
                <span className="px-2 py-1 border border-border">{room.subject}</span>
                <span>@{creatorHandle}</span>
                {isCurated && <span className="text-tertiary">MONOLITH</span>}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${statusColor} rounded-[var(--radius)] animate-pulse`} />
                <span className="font-[family-name:var(--font-primary)] text-xs uppercase tracking-widest">{status}</span>
              </div>
              <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary uppercase tracking-widest">
                Ambience: {room.defaultAmbience || 'Silence'}
              </span>
            </div>
          </div>
          
          <p className="font-[family-name:var(--font-primary)] text-secondary mt-2 max-w-xl">{room.vibe || 'No description provided.'}</p>
        </div>

        {/* Preview Grid (Blurred Snapshot) */}
        <div className="relative w-full aspect-video border border-border bg-surface overflow-hidden group">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 p-1 opacity-40 blur-[2px] pointer-events-none">
            {/* Mock blurred tiles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-background border border-border/50" />
            ))}
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10 backdrop-blur-[1px]">
            <div className="font-[family-name:var(--font-primary)] text-lg text-primary uppercase tracking-widest mb-6">
              {participantCount} studying now
            </div>
            
            <Link href={`/room/${resolvedParams.slug}/studio`}>
              <button className="px-10 py-4 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-sm tracking-widest uppercase transition-transform duration-120 active:scale-[0.98]">
                Join Room
              </button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
