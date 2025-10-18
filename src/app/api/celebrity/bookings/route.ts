import { NextRequest } from 'next/server';
import { ok, forbidden } from '@/app/api/_lib/response';
import { getSessionFromRequest, hasRole } from '@/lib/auth';
import { listLiveChatBookings } from '@/lib/celebrityScheduleStore';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, ['celebrity', 'admin'])) return forbidden('Only celebrities can view bookings');
  const bookings = listLiveChatBookings(session!.userId);
  return ok({ bookings });
}
