import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { bookings, events as eventsTable, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }
    if (!session.emailVerified) {
      return new Response(JSON.stringify({ error: 'Email not verified' }), { status: 403 });
    }
    const body = (await req.json()) as { eventId: string; quantity?: number };
    const { eventId } = body || ({} as any);
    const quantity = Math.max(1, Math.min(10, Number(body?.quantity ?? 1)));
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), { status: 400 });
    }

    const found = (await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1))[0];
    if (!found) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    const totalCents = found.priceCents * quantity;

    const [createdBooking] = await db
      .insert(bookings)
      .values({ eventId, userId: session.userId, status: 'pending', quantity, totalCents })
      .returning();

    const providerPaymentId = `ps_test_${randomUUID()}`;

    const [createdPayment] = await db
      .insert(payments)
      .values({
        bookingId: createdBooking.id,
        provider: 'paystack',
        status: 'pending',
        amountCents: totalCents,
        currency: 'USD',
        providerPaymentId,
        rawPayload: { test: true },
      })
      .returning();

    return new Response(
      JSON.stringify({ booking: createdBooking, payment: createdPayment }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
