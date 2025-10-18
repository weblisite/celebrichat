import { randomBytes } from 'crypto';

export type PaymentKind = 'ticket' | 'live_chat' | 'vendor_fee';

export const BASE_TICKET_KSH = 2_500;
export const LIVE_CHAT_ADDON_KSH = 500;
export const DEFAULT_VENDOR_FEE_KSH = 250;
export const DEFAULT_CURRENCY = 'KES';

export function kshToCents(ksh: number) {
  return Math.round(ksh * 100);
}

export function calculateAmountKsh(kind: PaymentKind, opts?: { quantity?: number; includeAddon?: boolean; vendorFeeKsh?: number }) {
  const qty = Math.max(1, Math.floor(opts?.quantity ?? 1));
  if (kind === 'ticket') {
    const base = BASE_TICKET_KSH * qty;
    const addon = opts?.includeAddon ? LIVE_CHAT_ADDON_KSH : 0;
    return base + addon;
  }
  if (kind === 'live_chat') {
    return LIVE_CHAT_ADDON_KSH; // standalone add-on
  }
  // vendor fee
  return opts?.vendorFeeKsh ?? DEFAULT_VENDOR_FEE_KSH;
}

export type PaystackInitInput = {
  email: string;
  amountCents: number;
  currency?: string; // defaults to KES
  metadata?: Record<string, unknown>;
  reference?: string; // optional reference to send to provider
};

export type PaystackInitResponse = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  raw: any;
};

export function generateReference(prefix = 'ref'): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

export async function initPaystackTransaction(input: PaystackInitInput): Promise<PaystackInitResponse> {
  const baseUrl = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
  const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx';
  const ref = input.reference || generateReference('book');

  const body = {
    email: input.email,
    amount: input.amountCents, // Paystack expects minor units
    currency: input.currency || DEFAULT_CURRENCY,
    reference: ref,
    metadata: input.metadata || {},
  } as any;

  const res = await fetch(`${baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Paystack init failed: ${res.status}`);
    (err as any).details = text;
    throw err;
  }

  const json = await res.json().catch(() => ({}));
  // Paystack returns { status, message, data: { authorization_url, access_code, reference } }
  const data = json?.data || {};
  const authorizationUrl = data.authorization_url || data.authorizationUrl;
  const accessCode = data.access_code || data.accessCode;
  const reference = data.reference || ref;
  if (!authorizationUrl || !reference) {
    throw new Error('Invalid Paystack initialize response');
  }
  return { authorizationUrl, accessCode, reference, raw: json };
}

export function buildPaymentMetadata(opts: {
  kind: PaymentKind;
  bookingId?: string;
  userId?: string;
  eventId?: string;
  isLiveChat?: boolean;
  extra?: Record<string, unknown>;
}) {
  return {
    kind: opts.kind,
    bookingId: opts.bookingId ?? null,
    userId: opts.userId ?? null,
    eventId: opts.eventId ?? null,
    isLiveChat: Boolean(opts.isLiveChat),
    ...opts.extra,
  };
}
