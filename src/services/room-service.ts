import { cache } from 'react';
import { prisma } from '@/lib/prisma';

// ── Room operations ─────────────────────────────────────────────────────────────

export const getRoomBySlug = cache(async (slug: string) => {
  return prisma.room.findUnique({ where: { slug } });
});

export async function createRoom(data: {
  name: string;
  subject: string;
  capacity: number;
  visibility: string;
  vibe?: string;
  password?: string;
  allowMic: boolean;
  allowCam: boolean;
  globalChatEnabled: boolean;
  creatorId: string;
}) {
  const slug =
    data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
    '-' +
    Math.random().toString(36).substring(2, 6);

  return prisma.room.create({
    data: {
      slug,
      name: data.name,
      subject: data.subject,
      capacity: data.capacity,
      visibility: data.visibility,
      vibe: data.vibe,
      password: data.password || null,
      allowMic: data.allowMic,
      allowCam: data.allowCam,
      globalChatEnabled: data.globalChatEnabled,
      creatorId: data.creatorId,
    },
  });
}

export async function toggleSaveRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { savedBy: { where: { id: userId } } },
  });

  if (!room) throw new Error('Room not found');

  const isSaved = room.savedBy.length > 0;

  if (isSaved) {
    await prisma.room.update({
      where: { id: roomId },
      data: { savedBy: { disconnect: { id: userId } } },
    });
  } else {
    await prisma.room.update({
      where: { id: roomId },
      data: { savedBy: { connect: { id: userId } } },
    });
  }

  return { isSaved: !isSaved };
}

export async function verifyRoomPassword(slug: string, password: string) {
  const room = await prisma.room.findUnique({ where: { slug } });

  if (!room) return { success: false, error: 'Room not found' };
  if (room.password && room.password !== password) {
    return { success: false, error: 'Invalid password' };
  }

  return { success: true };
}