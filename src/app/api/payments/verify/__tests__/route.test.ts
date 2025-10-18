import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { createHmac } from 'crypto';

// Access the globally mocked db from jest.setup and override behaviors in each test
const { db: mockDb } = jest.requireMock('@/db/client');

// Helper to build a Request
function makeReq(url: string, init?: RequestInit) {
  return new Request(url, init);
}

function signPayload(secret: string, body: any) {
  const raw = JSON.stringify(body);
  const sig = createHmac('sha512', secret).update(raw, 'utf8').digest('hex');
  return { raw, sig };
}

describe('/api/payments/verify', () => {
  const SECRET = 'test_secret_key_123';
  const modulePath = '@/app/api/payments/verify/route';

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    jest.resetModules();

    // Chainable mocks for db.select/insert/update used by the route
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }));

    mockDb.insert.mockImplementation(() => ({
      values: () => ({
        returning: async () => [{ id: 'payment-1' }],
      }),
    }));

    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: async () => [{ id: 'booking-123', status: 'confirmed' }],
        }),
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    global.fetch = undefined;
  });

  it('processes a valid Paystack webhook and is idempotent on duplicates', async () => {
    const { POST } = await import(modulePath);
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'ref_ticket_abc',
        status: 'success',
        amount: 250000, // cents
        currency: 'KES',
        metadata: { kind: 'ticket', bookingId: 'booking-123', userId: 'u1' },
      },
    };
    const { raw, sig } = signPayload(SECRET, payload);

    const req1 = makeReq('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-paystack-signature': sig },
      body: raw,
    });
    const res1 = await POST(req1 as any);
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.data?.processed).toBe(true);
    expect(json1.data?.status).toBe('succeeded');
    expect(json1.data?.bookingId).toBe('booking-123');

    // Duplicate delivery - should be ignored safely
    const req2 = makeReq('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-paystack-signature': sig },
      body: raw,
    });
    const res2 = await POST(req2 as any);
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.data?.replayed).toBe(true);
    expect(json2.data?.processed).toBe(false);

    // Insert should have been called once for the payment
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    // Booking update should have been called once
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it('supports manual verification polling without signature', async () => {
    const { POST } = await import(modulePath);

    // Mock Paystack verify endpoint
    // @ts-ignore
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ status: true, data: { status: 'success', amount: 12345, currency: 'KES', reference: 'ref_xyz' } }),
      text: async () => '',
    }));

    const req = makeReq('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reference: 'ref_xyz' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.reference).toBe('ref_xyz');
    expect(json.data?.status).toBe('succeeded');
  });

  it('handles vendor fee webhooks without touching bookings', async () => {
    const { POST } = await import(modulePath);
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'ref_vendor_fee_1',
        status: 'success',
        amount: 25000,
        currency: 'KES',
        metadata: { kind: 'vendor_fee', userId: 'u2' },
      },
    };
    const { raw, sig } = signPayload(SECRET, payload);

    const req = makeReq('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-paystack-signature': sig },
      body: raw,
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.processed).toBe(true);
    expect(json.data?.kind).toBe('vendor_fee');

    // Insert called once for payment upsert, no booking update
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
