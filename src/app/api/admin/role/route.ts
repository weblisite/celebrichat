import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { AppRole, getSessionFromRequest, mapAppRoleToDb } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = (await req.json()) as { userId: string; role: AppRole };
    const { userId, role } = body;
    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'userId and role are required' }), { status: 400 });
    }
    if (!['fan', 'celebrity', 'vendor', 'admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    await db.update(users).set({ role: mapAppRoleToDb(role) }).where(eq(users.id, userId));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
