import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/services/analytics';
import { getSessionFromRequest, hasRole } from '@/lib/auth';

// simple in-memory cache with TTL
const cache = new Map<string, { ts: number; data: any }>();
const TTL_MS = 60 * 1000; // 1 minute

function makeKey(url: URL) {
  const eventId = url.searchParams.get('eventId') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  return JSON.stringify({ eventId, from, to });
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!hasRole(session, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const key = makeKey(url);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json({ ok: true, cached: true, summary: cached.data });
  }

  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const eventId = url.searchParams.get('eventId');

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  try {
    const summary = await getAnalyticsSummary({ from: from || null, to: to || null, eventId: eventId || null });
    cache.set(key, { ts: now, data: summary });
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load analytics' }, { status: 500 });
  }
}
