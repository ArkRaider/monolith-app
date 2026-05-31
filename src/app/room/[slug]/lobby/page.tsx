import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import LobbyClient from './LobbyClient';

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LobbyPage({ params }: PageProps) {
  const { slug } = await params;
  
  const room = await prisma.room.findUnique({
    where: { slug }
  });

  if (!room) {
    notFound();
  }

  const requiresPassword = !!room.password;

  return (
    <LobbyClient 
      roomSlug={room.slug}
      roomName={room.name}
      requiresPassword={requiresPassword}
      allowCam={room.allowCam}
      allowMic={room.allowMic}
    />
  );
}
