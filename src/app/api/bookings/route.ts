import { badRequest, created, ok, forbidden, serverError } from '@/app/api/_lib/response';
import { getSessionFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { calculateAmountKsh, kshToCents } from '@/lib/payments/paystack';
import { createOrGetBooking, listBookingsForUser } from '@/services/bookings';

const bookingCreateSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.number().int().positive().default(1).optional(),
  isLiveChat: z.boolean().default(false).optional(),
  liveChatSlotId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return forbidden('Authentication required');
    const rows = await listBookingsForUser(session.userId);
    return ok(rows);
  } catch (err: any) {
    return serverError('Failed to fetch bookings', err?.message);
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return forbidden('Authentication required');

    const body = await request.json().catch(() => ({}));
    const parsed = bookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid request body', parsed.error.flatten());
    }

    const { eventId, isLiveChat = false } = parsed.data;
    const quantity = parsed.data.quantity ?? 1;
    if (isLiveChat && !parsed.data.liveChatSlotId) {
      return badRequest('Live chat slot selection is required for live chat bookings');
    }

    const totalKsh = calculateAmountKsh('ticket', { quantity, includeAddon: isLiveChat });
    const totalCents = kshToCents(totalKsh);

    const qrToken = randomBytes(12).toString('hex');
    const notes = parsed.data.notes ?? (isLiveChat && parsed.data.liveChatSlotId ? `liveChatSlot:${parsed.data.liveChatSlotId}` : null);

    const booking = await createOrGetBooking({
      eventId,
      userId: session.userId,
      quantity,
      totalCents,
      isLiveChat,
      notes,
      qrToken,
    });

    // If existing, respond with ok; otherwise created
    const isExisting = booking.qrToken !== qrToken; // crude heuristic; if we got existing, it won't match new token
    return isExisting ? ok(booking) : created(booking);
  } catch (err: any) {
    if (err?.code === 'not_found') return badRequest('Event not found');
    if (err?.code === 'bad_request') return badRequest(err.message);
    return serverError('Failed to create booking', err?.message);
  }
}
