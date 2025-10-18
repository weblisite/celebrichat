import { NextResponse } from 'next/server';
import { approveVendor } from '@/lib/vendorStore';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const { feeCents } = body || {};
  const vendor = approveVendor(params.id, { feeCents });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ vendor });
}
