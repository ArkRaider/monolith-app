import { cookies } from 'next/headers';
import StudioClient from './StudioClient';
import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

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
  let creatorId = '';

  if (user) {
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
    }
  }

  return (
    <StudioClient slug={slug} initialPwd={pwd} roomId={roomId} initialIsSaved={isSaved} creatorId={creatorId} />
  );
}
