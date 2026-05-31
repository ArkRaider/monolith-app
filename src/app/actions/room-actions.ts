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

export async function toggleSaveRoom(roomId: string) {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');

  const result = await toggleSaveRoomService(roomId, user.id);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/saved');
  revalidatePath('/dashboard/discover');

  return result;
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
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');

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
}

export async function verifyRoomPassword(slug: string, passwordAttempt: string) {
  const result = await verifyRoomPasswordService(slug, passwordAttempt);

  if (result.success) {
    const cookieStore = await cookies();
    cookieStore.set(`room_pwd_${slug}`, passwordAttempt, {
      maxAge: 3600,
      httpOnly: true,
    });
  }

  return result;
}