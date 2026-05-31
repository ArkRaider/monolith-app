import { NextResponse } from 'next/server';

export async function GET() {
  // In a real production app, this would hit Upstash Redis
  // `await redis.hgetall('active_users')`
  
  const now = Date.now();
  return NextResponse.json([
    { handle: 'dev_guy', room: 'Morning Grind', joinTime: now - 1000 * 60 * 134 },
    { handle: 'med_student', room: 'Deep Focus', joinTime: now - 1000 * 60 * 105 },
    { handle: 'sarah_w', room: 'The Library', joinTime: now - 1000 * 60 * 45 },
  ]);
}
