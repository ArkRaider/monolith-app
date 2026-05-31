import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getXpState, applyGoalXp } from '@/services/xp-service';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.userId ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const state = await getXpState(userId);
    return NextResponse.json(state);
  } catch (err: unknown) {
    console.error('[api/xp] GET error:', err);
    return NextResponse.json({ gained: 0, goal: 100, total: 0, fallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: { action?: string; taskId?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    }

    const { action, taskId } = body;

    if (!action || !taskId) {
      return NextResponse.json(
        { error: 'MISSING_ACTION_OR_TASK_ID' },
        { status: 400 }
      );
    }

    if (action !== 'TODO_COMPLETE' && action !== 'TODO_UNDO') {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }

    const isCompleting = action === 'TODO_COMPLETE';
    const result = await applyGoalXp(userId, taskId, isCompleting);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error('[api/xp] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}