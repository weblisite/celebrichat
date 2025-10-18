import { NextResponse } from 'next/server';
import { markVendorPaid } from '@/lib/vendorStore';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const vendor = markVendorPaid(params.id);
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ vendor });
}
