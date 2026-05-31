import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/services/user-service';
import { getUserById } from '@/services/user-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: { receiverId?: string; content?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON_BODY' }, { status: 400 });
    }

    const { receiverId, content } = body;
    if (!receiverId?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'MISSING_RECEIVER_OR_CONTENT' },
        { status: 400 }
      );
    }

    // Auto-sync sender
    const sender = await getUserById(userId);
    if (!sender) {
      const { currentUser } = await import('@clerk/nextjs/server');
      const clerkUser = await currentUser();
      if (clerkUser) {
        await ensureUserExists({
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses as { emailAddress: string }[] | undefined,
          username: clerkUser.username,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        });
      }
    }

    // Verify receiver
    const receiverExists = await getUserById(receiverId);
    if (!receiverExists) {
      return NextResponse.json({ error: 'RECEIVER_NOT_FOUND' }, { status: 404 });
    }

    const msg = await prisma.directMessage.create({
      data: {
        senderId: userId,
        receiverId: receiverId.trim(),
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (err: unknown) {
    console.error('[api/dm/send] POST error:', err);
    return NextResponse.json({ error: 'SEND_FAILED' }, { status: 500 });
  }
}