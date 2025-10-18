import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { AppRole, Session, createSessionCookie, mapDbRoleToApp } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email: string };
    const email = (body.email || '').toLowerCase().trim();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existing.length) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    const user = existing[0];
    const role: AppRole = mapDbRoleToApp(user.role);

    // For demo purposes, we assume email not verified until verify endpoint is called
    const session: Session = { userId: user.id, email, role, emailVerified: false };

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', createSessionCookie(session));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
