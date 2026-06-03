import { cookies } from 'next/headers';
import StudioClient from './StudioClient';
import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { NotificationProvider } from '@/components/room/context/NotificationContext';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StudioPage({ params }: PageProps) {
  const { slug } = await params;
  
  const cookieStore = await cookies();
  const pwd = cookieStore.get(`room_pwd_${slug}`)?.value || undefined;

  const user = await currentUser();
  let roomId = '';
  let isSaved = false;
  let capacity = 0;
  let creatorId = '';
  let currentUserHandle = '';
  let currentDisplayName = '';

  let isCurated = false;

  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser) {
      currentUserHandle = dbUser.handle;
      currentDisplayName = dbUser.displayName;
    }

    const room = await prisma.room.findUnique({
      where: { slug },
      include: {
        savedBy: {
          where: { id: user.id }
        }
      }
    });
    if (room) {
      roomId = room.id;
      isSaved = room.savedBy.length > 0;
      creatorId = room.creatorId;
      capacity = room.capacity;
      isCurated = room.isDefaultRoom;
    }
  }

  return (
    <NotificationProvider>
      <StudioClient 
        slug={slug} 
        initialPwd={pwd} 
        roomId={roomId} 
        initialIsSaved={isSaved} 
        creatorId={creatorId} 
        capacity={capacity} 
        currentUserHandle={currentUserHandle}
        currentDisplayName={currentDisplayName}
        isCurated={isCurated}
      />
    </NotificationProvider>
  );
}
