import { describe, expect, it } from '@jest/globals';
import { POST } from '@/app/api/payments/route';
import { createSessionCookie } from '@/lib/auth';

function makeReq(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe('/api/payments', () => {
  it('requires auth', async () => {
    const req = makeReq('http://localhost/api/payments', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it('returns bad request when user not found', async () => {
    const session = createSessionCookie({ userId: 'does-not-exist', email: 'x@example.com', role: 'fan', emailVerified: true });
    const req = makeReq('http://localhost/api/payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: session },
      body: JSON.stringify({ kind: 'vendor_fee', vendorFeeKsh: 250 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/User not found/);
  });
});
