import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MinimalDashboardClient from './MinimalDashboardClient';
import { NotificationProvider } from '@/components/room/context/NotificationContext';

export const dynamic = 'force-dynamic';

export default async function MinimalDashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const dbRooms = await prisma.room.findMany({
    where: {
      AND: [
        {
          OR: [
            { temporary: false },
            { AND: [{ temporary: true }, { creatorId: user.id }] }
          ]
        },
        {
          OR: [
            { visibility: 'PUBLIC' },
            { creatorId: user.id }
          ]
        }
      ]
    },
    include: {
      creator: true,
      participants: true,
      savedBy: { where: { id: user.id } }
    },
    orderBy: [{ isDefaultRoom: 'desc' }, { createdAt: 'desc' }]
  });

  const mappedRooms = dbRooms.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    subject: r.subject,
    capacity: r.capacity,
    vibe: r.vibe,
    visibility: r.visibility,
    creatorName: r.creator.handle || r.creator.displayName || 'Unknown',
    creatorId: r.creatorId,
    participantCount: r.participants.length,
    isCurated: r.isDefaultRoom,
    isSaved: r.savedBy.length > 0,
    // Provide defaults for hardware states if not on Prisma schema yet
    allowCam: (r as any).allowCam ?? true, 
    allowMic: (r as any).allowMic ?? true,
  }));

  return (
    <NotificationProvider>
      <MinimalDashboardClient
        initialRooms={mappedRooms}
        clerkId={user.id}
      />
    </NotificationProvider>
  );
}
