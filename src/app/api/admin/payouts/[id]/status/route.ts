import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleRepoForNode, transitionPayout } from '@/lib/payouts/service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const to = body.to as 'pending' | 'ready' | 'paid' | undefined;
  if (!to) return NextResponse.json({ ok: false, error: 'Missing target status' }, { status: 400 });
  try {
    const repo = createDrizzleRepoForNode();
    const updated = await transitionPayout(repo, id, to);
    return NextResponse.json({ ok: true, payout: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Failed' }, { status: 400 });
  }
}
