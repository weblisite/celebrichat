import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { bookings, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac } from 'crypto';

function verifySignature(secret: string | undefined, rawBody: string, signature: string | null) {
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!signature) return false;
  const computed = createHmac('sha512', secret).update(rawBody).digest('hex');
  return computed === signature;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const ok = verifySignature(process.env.PAYSTACK_SECRET_KEY, raw, signature);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }
    const body = JSON.parse(raw) as { event: string; data?: any };
    if (body.event !== 'charge.success') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    const reference: string | undefined = body?.data?.reference || body?.data?.id || body?.data?.payment_reference;
    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), { status: 400 });
    }

    const payment = (await db.select().from(payments).where(eq(payments.providerPaymentId, reference)).limit(1))[0];
    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
    }

    // Update payment and booking status
    await db.update(payments).set({ status: 'succeeded', rawPayload: body, updatedAt: new Date() }).where(eq(payments.id, payment.id));
    await db.update(bookings).set({ status: 'confirmed', updatedAt: new Date() }).where(eq(bookings.id, payment.bookingId));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), { status: 500 });
  }
}
