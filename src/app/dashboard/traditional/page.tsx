import prisma from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onboardingCompleted: true }
  });

  if (dbUser && !dbUser.onboardingCompleted) {
    redirect('/onboarding');
  }

  const [dbRooms] = await Promise.all([
    prisma.room.findMany({
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
    })
  ]);

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

  return (
    <DashboardClient
      initialRooms={mappedRooms}
      clerkId={user.id}
    />
  );
}
