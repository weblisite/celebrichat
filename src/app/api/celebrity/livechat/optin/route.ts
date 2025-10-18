import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '@/app/api/_lib/response';
import { getSessionFromRequest, hasRole } from '@/lib/auth';
import { allocateLiveChatSlot } from '@/lib/celebrityScheduleStore';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, ['celebrity', 'admin'])) return forbidden('Only celebrities can allocate live chat');
  const body = await req.json().catch(() => ({}));
  const { date, preferredTime, fanName, fanContact } = body as {
    date?: string;
    preferredTime?: string | null;
    fanName?: string;
    fanContact?: string;
  };
  if (!date || !fanName || !fanContact) return badRequest('date, fanName and fanContact are required');
  const booking = allocateLiveChatSlot({
    celebrityId: session!.userId,
    date,
    preferredTime: preferredTime ?? null,
    fanName,
    fanContact,
  });
  if (!booking) return badRequest('No available slot found');
  return ok(booking);
}
