import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const myId = session?.userId ?? null;
    if (!myId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { userId: partnerId } = await params;
    if (!partnerId?.trim()) {
      return NextResponse.json([], { status: 200 });
    }

    // Mark incoming as read (best-effort)
    try {
      await prisma.directMessage.updateMany({
        where: { senderId: partnerId, receiverId: myId, read: false },
        data: { read: true },
      });
    } catch (markErr) {
      console.warn('[api/dm/messages] Mark-read failed:', markErr);
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: partnerId },
          { senderId: partnerId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (err: unknown) {
    console.error('[api/dm/messages] GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}