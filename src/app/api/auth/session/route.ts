import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return new Response(JSON.stringify({ session }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
