import { describe, expect, it } from '@jest/globals';
import { GET, POST } from '@/app/api/bookings/route';
import { createSessionCookie } from '@/lib/auth';

function makeReq(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe('/api/bookings', () => {
  it('GET requires auth', async () => {
    const res = await GET(makeReq('http://localhost/api/bookings'));
    expect(res.status).toBe(403);
  });

  it('POST requires live chat slot when isLiveChat is true', async () => {
    const session = createSessionCookie({ userId: 'u1', email: 'a@example.com', role: 'fan', emailVerified: true });
    const req = makeReq('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: session },
      body: JSON.stringify({ eventId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', isLiveChat: true }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/Live chat slot selection/);
  });
});
