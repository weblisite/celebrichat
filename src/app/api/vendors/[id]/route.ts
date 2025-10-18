import { NextResponse } from 'next/server';
import { getVendorById } from '@/lib/vendorStore';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const vendor = getVendorById(params.id);
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ vendor });
}
