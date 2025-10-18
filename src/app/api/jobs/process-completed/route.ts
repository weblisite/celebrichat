import { NextResponse } from 'next/server';
import { createDrizzleRepoForEdge, processCompletedEvents } from '@/lib/payouts/service';

export const runtime = 'edge';

export async function POST() {
  const repo = createDrizzleRepoForEdge();
  const result = await processCompletedEvents(repo);
  return NextResponse.json({ ok: true, ...result });
}
