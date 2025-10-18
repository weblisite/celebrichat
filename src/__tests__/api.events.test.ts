/** @jest-environment node */
import { GET as getEvents, POST as postEvent } from '@/app/api/events/route';
import { PUT as putEvent } from '@/app/api/events/[id]/route';

// Mock services to avoid real DB
jest.mock('@/services/events', () => {
  let events: any[] = [];
  return {
    __esModule: true,
    listEvents: async ({ offset, limit, status, celebrityId, search }: any) => {
      let rows = [...events];
      if (status) rows = rows.filter((e) => e.status === status);
      if (celebrityId) rows = rows.filter((e) => e.celebrityId === celebrityId);
      if (search) rows = rows.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
      return { rows: rows.slice(offset, offset + limit), total: rows.length };
    },
    createEvent: async (input: any) => {
      const e = {
        id: 'e-' + Math.random().toString(36).slice(2),
        status: 'draft',
        updatedAt: new Date(),
        createdAt: new Date(),
        metadata: { sessions: input.metadata?.sessions ?? [] },
        ...input,
      };
      events.push(e);
      return e;
    },
    updateEvent: async ({ id, expectedUpdatedAt, patch }: any) => {
      const idx = events.findIndex((e) => e.id === id);
      if (idx === -1) {
        const err: any = new Error('not found');
        err.code = 'not_found';
        throw err;
      }
      const existing = events[idx];
      if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        const err: any = new Error('conflict');
        err.code = 'conflict';
        err.currentUpdatedAt = existing.updatedAt;
        throw err;
      }
      const allowed: Record<string, string[]> = { draft: ['published', 'cancelled'], published: ['completed', 'cancelled'], cancelled: [], completed: [] };
      if (patch.status && !allowed[existing.status].includes(patch.status)) {
        const err: any = new Error('bad transition');
        err.code = 'bad_request';
        throw err;
      }
      events[idx] = { ...existing, ...patch, updatedAt: new Date() };
      return events[idx];
    },
  };
});

describe('Events API', () => {
  it('GET /api/events returns public list', async () => {
    const req = new Request('http://localhost/api/events?page=1&pageSize=10');
    const res = await getEvents(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.error).toBeNull();
  });

  it('POST /api/events enforces admin role', async () => {
    const req = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'public' },
      body: JSON.stringify({
        celebrityId: '11111111-1111-1111-1111-111111111111',
        title: 'New Event',
        eventDate: new Date().toISOString(),
        priceCents: 2000,
      }),
    });
    const res = await postEvent(req as any);
    expect(res.status).toBe(403);
  });

  it('POST /api/events creates with default five sessions unless provided', async () => {
    const req = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({
        celebrityId: '11111111-1111-1111-1111-111111111111',
        title: 'With Sessions',
        eventDate: new Date().toISOString(),
        priceCents: 2000,
        sessions: Array.from({ length: 5 }).map((_, i) => ({ id: 's' + i, title: 'S' + i, startTime: new Date().toISOString(), endTime: new Date().toISOString(), speakerId: null })),
      }),
    });
    const res = await postEvent(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.metadata.sessions).toHaveLength(5);
  });

  it('PUT /api/events/:id enforces optimistic updates and transitions', async () => {
    // first create an event
    const create = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({
        celebrityId: '11111111-1111-1111-1111-111111111111',
        title: 'Updatable',
        eventDate: new Date().toISOString(),
        priceCents: 5000,
      }),
    });
    const created = await postEvent(create as any);
    const createdJson = await created.json();
    const event = createdJson.data;

    // conflict case
    const staleReq = new Request(`http://localhost/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({ expectedUpdatedAt: new Date(0).toISOString(), title: 'New Title' }),
    });
    const staleRes = await putEvent(staleReq as any, { params: { id: event.id } } as any);
    expect(staleRes.status).toBe(409);

    // valid transition
    const okReq = new Request(`http://localhost/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'admin' },
      body: JSON.stringify({ expectedUpdatedAt: event.updatedAt, status: 'published' }),
    });
    const okRes = await putEvent(okReq as any, { params: { id: event.id } } as any);
    expect(okRes.status).toBe(200);
    const okJson = await okRes.json();
    expect(okJson.data.status).toBe('published');
  });
});
