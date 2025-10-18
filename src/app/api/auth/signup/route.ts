import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { AppRole, Session, createSessionCookie, mapAppRoleToDb, mapDbRoleToApp } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email: string; name?: string };
    const email = (body.email || '').toLowerCase().trim();
    const name = body.name?.trim() || email.split('@')[0] || 'User';
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // Upsert user. If exists, don't change role here.
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let userId: string;
    let role: AppRole = 'fan';
    if (existing.length) {
      userId = existing[0].id;
      role = mapDbRoleToApp(existing[0].role);
    } else {
      const inserted = await db.insert(users).values({ email, name, role: mapAppRoleToDb('fan') }).returning();
      userId = inserted[0].id;
      role = 'fan';
    }

    const session: Session = { userId, email, role, emailVerified: false };
    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', createSessionCookie(session));

    // In a real implementation, email verification would be sent here
    return new Response(JSON.stringify({ ok: true, needsVerification: true }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
