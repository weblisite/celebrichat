import { NextRequest } from 'next/server';
import { getSessionFromRequest, createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const current = getSessionFromRequest(req);
    if (!current) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }
    const session = { ...current, emailVerified: true };
    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', createSessionCookie(session));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
