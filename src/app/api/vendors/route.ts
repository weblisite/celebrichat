import { NextResponse } from 'next/server';
import { applyVendor, listVendors } from '@/lib/vendorStore';

export async function GET() {
  return NextResponse.json({ vendors: listVendors() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { companyName, contactEmail, contactName } = body || {};
  if (!companyName || !contactEmail || !contactName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const vendor = applyVendor({ companyName, contactEmail, contactName });
  return NextResponse.json({ vendor });
}
