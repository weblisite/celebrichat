import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '@/app/api/_lib/response';
import { getSessionFromRequest, hasRole } from '@/lib/auth';
import { blockSlot, unblockSlot } from '@/lib/celebrityScheduleStore';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, ['celebrity', 'admin'])) return forbidden('Only celebrities can block slots');
  const body = await req.json().catch(() => ({}));
  const { date, time } = body as { date?: string; time?: string };
  if (!date || !time) return badRequest('date and time are required');
  const success = blockSlot(session!.userId, date, time);
  return ok({ ok: success });
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, ['celebrity', 'admin'])) return forbidden('Only celebrities can unblock slots');
  const body = await req.json().catch(() => ({}));
  const { date, time } = body as { date?: string; time?: string };
  if (!date || !time) return badRequest('date and time are required');
  const success = unblockSlot(session!.userId, date, time);
  return ok({ ok: success });
}
