import prisma from '@/lib/prisma';
import { DashboardClient } from '../DashboardClient';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MyRoomsPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const dbRooms = await prisma.room.findMany({
    where: { creatorId: user.id },
    include: {
      creator: true,
      participants: true,
      savedBy: {
        where: { id: user.id }
      }
    },
    orderBy: { createdAt: 'desc' }
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
    isSaved: r.savedBy.length > 0
  }));

  return <DashboardClient initialRooms={mappedRooms} clerkId={user.id} />;
}
