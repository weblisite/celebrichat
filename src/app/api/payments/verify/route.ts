import { badRequest, ok, serverError } from '@/app/api/_lib/response';
import { db } from '@/db/client';
import { bookings, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac, createHash } from 'crypto';

// Very small in-memory replay protection cache (also useful in tests)
const processedEventHashes = new Set<string>();

function safeLog(msg: string, meta?: Record<string, unknown>) {
  try {
    // Avoid logging entire payloads; include only small metadata
    // eslint-disable-next-line no-console
    console.log(`[paystack:webhook] ${msg}`, meta ? JSON.stringify(meta) : '');
  } catch {}
}

function computeSignature(body: string, secret: string) {
  return createHmac('sha512', secret).update(body, 'utf8').digest('hex');
}

function computeEventHash(body: string) {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

async function upsertPaymentByReference(ref: string, update: {
  status: 'initialized' | 'pending' | 'succeeded' | 'failed' | 'refunded';
  amountCents?: number;
  currency?: string;
  rawPayload?: Record<string, unknown> | null;
  bookingId?: string | null;
}) {
  // Try find by providerPaymentId (unique)
  const existing = await db.select().from(payments).where(eq(payments.providerPaymentId, ref)).limit(1);
  if (existing.length) {
    const [row] = await db
      .update(payments)
      .set({
        status: update.status,
        rawPayload: (update.rawPayload as any) ?? existing[0].rawPayload ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payments.providerPaymentId, ref))
      .returning();
    return row;
  }
  const [inserted] = await db
    .insert(payments)
    .values({
      bookingId: update.bookingId || '00000000-0000-0000-0000-000000000000', // In vendor fee case we may not have booking
      provider: 'paystack',
      status: update.status,
      amountCents: update.amountCents ?? 0,
      currency: update.currency || 'KES',
      providerPaymentId: ref,
      rawPayload: (update.rawPayload as any) ?? null,
    })
    .returning();
  return inserted;
}

async function confirmBooking(bookingId: string) {
  const [row] = await db
    .update(bookings)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();
  return row;
}

function extractKind(meta: any): 'ticket' | 'live_chat' | 'vendor_fee' | null {
  const k = meta?.kind;
  if (k === 'ticket' || k === 'live_chat' || k === 'vendor_fee') return k;
  return null;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-paystack-signature');

    // Read raw body first (for signature verification and hashing)
    const rawBody = await request.text();
    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = {};
    }

    // Manual verification polling fallback (no signature header present)
    if (!signature) {
      const reference = String(body?.reference || body?.ref || body?.trxref || '').trim();
      if (!reference) return badRequest('reference is required');

      // Call Paystack verify endpoint
      const baseUrl = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
      const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx';
      const res = await fetch(`${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return serverError('Verification lookup failed', text);
      }
      const json = await res.json().catch(() => ({}));
      const data = json?.data || {};
      const providerStatus = String(data?.status || '').toLowerCase();
      const status: 'pending' | 'succeeded' | 'failed' = providerStatus === 'success' ? 'succeeded' : providerStatus === 'failed' ? 'failed' : 'pending';

      // Optionally upsert our payment record with latest status
      try {
        await upsertPaymentByReference(reference, {
          status,
          amountCents: typeof data?.amount === 'number' ? data.amount : undefined,
          currency: data?.currency || 'KES',
          rawPayload: json,
        });
      } catch (e) {
        // swallow DB errors in fallback mode; still return status to client
        safeLog('upsert failed during manual verification', { ref: reference });
      }

      return ok({ reference, status });
    }

    // Webhook path: verify signature
    const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx';
    const expected = computeSignature(rawBody, secret);
    if (expected !== signature) {
      return badRequest('Invalid signature');
    }

    // Replay protection
    const eventHash = computeEventHash(rawBody);
    if (processedEventHashes.has(eventHash)) {
      safeLog('duplicate event ignored', { hash: eventHash });
      return ok({ processed: false, replayed: true });
    }

    // Mark hash processed (before DB to avoid race duplicates)
    processedEventHashes.add(eventHash);

    // Extract Paystack payload
    const event = String(body?.event || '').toLowerCase();
    const data = body?.data || {};
    const reference = String(data?.reference || data?.ref || '').trim();
    const amount = typeof data?.amount === 'number' ? data.amount : 0;
    const currency = data?.currency || 'KES';
    const metadata = (data?.metadata as any) || {};
    const kind = extractKind(metadata);

    if (!reference) {
      return badRequest('Missing reference in webhook');
    }

    // Determine status mapping
    let status: 'pending' | 'succeeded' | 'failed' = 'pending';
    if (event === 'charge.success' || String(data?.status).toLowerCase() === 'success') status = 'succeeded';
    if (event === 'charge.failed' || String(data?.status).toLowerCase() === 'failed') status = 'failed';

    // Upsert payment and update booking if applicable
    await upsertPaymentByReference(reference, {
      status,
      amountCents: amount,
      currency,
      rawPayload: body,
      bookingId: metadata?.bookingId || null,
    });

    let bookingUpdated: string | null = null;
    if (status === 'succeeded' && metadata?.bookingId && (kind === 'ticket' || kind === 'live_chat')) {
      try {
        const updated = await confirmBooking(metadata.bookingId);
        bookingUpdated = updated?.id || null;
      } catch (e) {
        safeLog('booking update failed', { bookingId: metadata?.bookingId });
      }
    }

    // We could trigger an email here; for now just acknowledge
    safeLog('webhook processed', { event, reference, kind, bookingUpdated: Boolean(bookingUpdated) });

    return ok({ processed: true, status, reference, bookingId: bookingUpdated, kind });
  } catch (err: any) {
    return serverError('Failed to process verification', err?.message);
  }
}
