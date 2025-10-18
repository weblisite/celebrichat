import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '@/app/api/_lib/response';
import { getSessionFromRequest, hasRole } from '@/lib/auth';
import { getSchedule } from '@/lib/celebrityScheduleStore';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, ['celebrity', 'admin'])) return forbidden('Only celebrities can view schedules');

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date) return badRequest('date is required (YYYY-MM-DD)');
  const celebId = session!.userId;
  const slots = getSchedule(celebId, date);
  return ok({ date, slots });
}
