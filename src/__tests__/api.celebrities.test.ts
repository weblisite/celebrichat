/** @jest-environment node */
import { GET as getCelebs, POST as postCeleb } from '@/app/api/celebrities/route';

// Mock services to avoid real DB
jest.mock('@/services/celebrities', () => {
  const celebs: any[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      userId: '22222222-2222-2222-2222-222222222222',
      stageName: 'Alice Star',
      bio: null,
      category: 'actor',
      priceCents: 10000,
      available: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  return {
    __esModule: true,
    listCelebrities: async ({ offset, limit, search }: any) => {
      let rows = [...celebs];
      if (search) rows = rows.filter((c) => c.stageName.toLowerCase().includes(search.toLowerCase()));
      return { rows: rows.slice(offset, offset + limit), total: rows.length };
    },
    createCelebrity: async (input: any) => {
      const created = {
        id: '33333333-3333-3333-3333-333333333333',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      celebs.push(created);
      return created;
    },
  };
});

describe('Celebrities API', () => {
  it('GET /api/celebrities returns envelope and pagination meta', async () => {
    const req = new Request('http://localhost/api/celebrities?page=1&pageSize=10&search=alice');
    const res = await getCelebs(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('error', null);
    expect(json).toHaveProperty('meta');
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('POST /api/celebrities rejects non-admin', async () => {
    const req = new Request('http://localhost/api/celebrities', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'customer' },
      body: JSON.stringify({
        userId: '22222222-2222-2222-2222-222222222222',
        stageName: 'New Star',
        category: 'actor',
        priceCents: 5000,
      }),
    });
    const res = await postCeleb(req as any);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('forbidden');
  });

  it('POST /api/celebrities validates input and creates', async () => {
    const req = new Request('http://localhost/api/celebrities', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({
        userId: '22222222-2222-2222-2222-222222222222',
        stageName: 'New Star',
        category: 'actor',
        priceCents: 5000,
      }),
    });
    const res = await postCeleb(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.stageName).toBe('New Star');
  });

  it('POST /api/celebrities returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/api/celebrities', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({ stageName: '' }),
    });
    const res = await postCeleb(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('bad_request');
  });
});
