import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { BASE_TICKET_KSH, LIVE_CHAT_ADDON_KSH, calculateAmountKsh, generateReference, initPaystackTransaction, kshToCents } from '@/lib/payments/paystack';

describe('paystack helpers', () => {
  it('calculates amounts correctly', () => {
    expect(calculateAmountKsh('ticket', { quantity: 1 })).toBe(BASE_TICKET_KSH);
    expect(calculateAmountKsh('ticket', { quantity: 2 })).toBe(BASE_TICKET_KSH * 2);
    expect(calculateAmountKsh('ticket', { quantity: 1, includeAddon: true })).toBe(BASE_TICKET_KSH + LIVE_CHAT_ADDON_KSH);
    expect(calculateAmountKsh('live_chat')).toBe(LIVE_CHAT_ADDON_KSH);
  });

  it('generates unique references', () => {
    const a = generateReference('test');
    const b = generateReference('test');
    expect(a).not.toEqual(b);
    expect(a.startsWith('test_')).toBe(true);
  });
});

describe('initPaystackTransaction', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ status: true, data: { authorization_url: 'https://paystack/authorize', access_code: 'AC123', reference: 'ref_123' } }),
    })) as any;
  });

  it('returns authorization url and reference', async () => {
    const res = await initPaystackTransaction({ email: 'a@example.com', amountCents: kshToCents(BASE_TICKET_KSH) });
    expect(res.authorizationUrl).toBeTruthy();
    expect(res.reference).toBeTruthy();
  });
});
