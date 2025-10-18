import { badRequest, created, forbidden, serverError } from '@/app/api/_lib/response';
import { getSessionFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/db/client';
import { bookings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildPaymentMetadata, calculateAmountKsh, initPaystackTransaction, kshToCents, LIVE_CHAT_ADDON_KSH, BASE_TICKET_KSH } from '@/lib/payments/paystack';
import { createInitializedPayment } from '@/services/payments';

const paymentInitSchema = z.object({
  bookingId: z.string().uuid().optional(),
  kind: z.enum(['ticket', 'live_chat', 'vendor_fee']),
  vendorFeeKsh: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return forbidden('Authentication required');

    const body = await request.json().catch(() => ({}));
    const parsed = paymentInitSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid request body', parsed.error.flatten());
    }

    const { kind } = parsed.data;

    // Fetch user email
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return badRequest('User not found');

    let amountCents = 0;
    let bookingRow: any = null;
    let metadata: Record<string, unknown> = {};

    if (kind === 'vendor_fee') {
      const vendorFeeKsh = parsed.data.vendorFeeKsh ?? undefined;
      const amtKsh = calculateAmountKsh('vendor_fee', { vendorFeeKsh });
      amountCents = kshToCents(amtKsh);
      metadata = buildPaymentMetadata({ kind, userId: session.userId });
    } else {
      // Require bookingId
      if (!parsed.data.bookingId) return badRequest('bookingId is required for this payment');
      const [row] = await db.select().from(bookings).where(eq(bookings.id, parsed.data.bookingId)).limit(1);
      if (!row) return badRequest('Booking not found');
      if (row.userId !== session.userId) return forbidden('Cannot initialize payment for another user');
      bookingRow = row;

      if (kind === 'ticket') {
        const amtKsh = BASE_TICKET_KSH * row.quantity;
        amountCents = kshToCents(amtKsh);
      } else if (kind === 'live_chat') {
        const amtKsh = LIVE_CHAT_ADDON_KSH;
        amountCents = kshToCents(amtKsh);
      }

      metadata = buildPaymentMetadata({
        kind,
        bookingId: row.id,
        userId: session.userId,
        eventId: row.eventId,
        isLiveChat: row.isLiveChat,
      });
    }

    const init = await initPaystackTransaction({
      email: user.email,
      amountCents,
      currency: 'KES',
      metadata,
    });

    const payment = await createInitializedPayment({
      bookingId: bookingRow ? bookingRow.id : '00000000-0000-0000-0000-000000000000', // placeholder for vendor fee type
      amountCents,
      currency: 'KES',
      provider: 'paystack',
      providerPaymentId: init.reference,
      rawPayload: init.raw,
      status: 'initialized',
    });

    return created({ authorizationUrl: init.authorizationUrl, reference: init.reference, paymentId: payment.id });
  } catch (err: any) {
    if (err?.message?.startsWith('Paystack init failed')) {
      return serverError('Failed to initialize payment', err?.details || err?.message);
    }
    return serverError('Failed to initialize payment', err?.message);
  }
}
