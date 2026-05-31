import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByHandle } from '@/services/user-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { handle } = await params;
    if (!handle?.trim()) {
      return NextResponse.json({ error: 'HANDLE_REQUIRED' }, { status: 400 });
    }

    const user = await getUserByHandle(handle.trim().toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[api/users/by-handle] GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}