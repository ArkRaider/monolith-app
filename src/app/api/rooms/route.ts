import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createRoom } from '@/services/room-service';
import { ensureUserExists } from '@/services/user-service';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await ensureUserExists({
      id: user.id,
      emailAddresses: user.emailAddresses as { emailAddress: string }[] | undefined,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });

    const { name, subject, capacity } = await req.json();

    const room = await createRoom({
      name,
      subject,
      capacity: parseInt(capacity),
      visibility: 'PUBLIC',
      allowMic: true,
      allowCam: true,
      globalChatEnabled: true,
      creatorId: user.id,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Failed to create room:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}