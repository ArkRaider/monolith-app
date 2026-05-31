import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/services/user-service';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const userExists = await getUserById(userId);
    if (!userExists) return NextResponse.json([], { status: 200 });

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
      },
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const conversationsMap = new Map<
      string,
      {
        partner: {
          id: string;
          handle: string;
          displayName: string;
          avatarUrl: string | null;
        };
        lastMessage: string;
        lastMessageAt: Date;
        unread: number;
      }
    >();

    for (const msg of messages) {
      const partnerId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!partnerId || !partner) continue;

      if (!conversationsMap.has(partnerId)) {
        const unread = messages.filter(
          (m) => m.senderId === partnerId && m.receiverId === userId && !m.read
        ).length;

        conversationsMap.set(partnerId, {
          partner,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread,
        });
      }
    }

    return NextResponse.json(Array.from(conversationsMap.values()), {
      status: 200,
    });
  } catch (err: unknown) {
    console.error('[api/dm/conversations] GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}