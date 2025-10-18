import { db } from '@/db/client';
import { payments } from '@/db/schema';

export type CreatePaymentInput = {
  bookingId: string;
  amountCents: number;
  currency: string;
  provider: 'paystack' | 'stripe' | 'paypal' | 'test';
  providerPaymentId: string | null;
  rawPayload?: Record<string, unknown> | null;
  status?: 'initialized' | 'pending' | 'succeeded' | 'failed' | 'refunded';
};

export async function createInitializedPayment(input: CreatePaymentInput) {
  const [row] = await db
    .insert(payments)
    .values({
      bookingId: input.bookingId,
      provider: input.provider,
      status: input.status ?? 'initialized',
      amountCents: input.amountCents,
      currency: input.currency,
      providerPaymentId: input.providerPaymentId,
      rawPayload: (input.rawPayload as any) ?? null,
    })
    .returning();
  return row;
}
