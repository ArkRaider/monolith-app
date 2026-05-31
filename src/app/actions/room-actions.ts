'use server';

import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  createRoom,
  toggleSaveRoom as toggleSaveRoomService,
  verifyRoomPassword as verifyRoomPasswordService,
} from '@/services/room-service';
import { ensureUserExists } from '@/services/user-service';
import prisma from '@/lib/prisma';

export async function toggleSaveRoom(formData: FormData) {
  try {
    const roomId = formData.get('roomId') as string;
    if (!roomId) return { error: 'Invalid room ID' };
    
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    const result = await toggleSaveRoomService(roomId, user.id);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/saved');
    revalidatePath('/dashboard/discover');

    return result;
  } catch (error) {
    console.error('[room-actions] toggleSaveRoom error:', error);
    return { error: 'Failed to save room' };
  }
}

export async function createRoomAction(data: {
  name: string;
  subject: string;
  capacity: number;
  vibe?: string;
  visibility: string;
  password?: string;
  allowMic: boolean;
  allowCam: boolean;
  globalChatEnabled: boolean;
}) {
  try {
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    await ensureUserExists({
      id: user.id,
      emailAddresses: user.emailAddresses as { emailAddress: string }[] | undefined,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });

    const room = await createRoom({ ...data, creatorId: user.id });

    revalidatePath('/dashboard');
    return { slug: room.slug };
  } catch (error) {
    console.error('[room-actions] createRoomAction error:', error);
    return { error: 'Failed to create room' };
  }
}

export async function verifyRoomPassword(slug: string, passwordAttempt: string) {
  try {
    const result = await verifyRoomPasswordService(slug, passwordAttempt);

    if (result.success) {
      const cookieStore = await cookies();
      cookieStore.set(`room_pwd_${slug}`, passwordAttempt, {
        maxAge: 3600,
        httpOnly: true,
      });
    }

    return result;
  } catch (error) {
    console.error('[room-actions] verifyRoomPassword error:', error);
    return { error: 'Failed to verify password' };
  }
}

export async function deleteRoomAction(roomId: string) {
  try {
    const user = await currentUser();
    if (!user) return { error: 'Unauthorized' };

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return { error: 'Room not found' };
    
    // Only allow creator to delete
    if (room.creatorId !== user.id) {
      return { error: 'Unauthorized to delete this room' };
    }

    await prisma.room.delete({ where: { id: roomId } });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/saved');
    revalidatePath('/dashboard/discover');

    return { success: true };
  } catch (error) {
    console.error('[room-actions] deleteRoom error:', error);
    return { error: 'Failed to delete room' };
  }
}