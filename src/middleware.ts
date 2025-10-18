import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, guardRoute } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const decision = guardRoute(req.nextUrl.pathname, session);

  if (decision.type === 'redirect') {
    const url = new URL(decision.location, req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  if (decision.type === 'forbidden') {
    const url = new URL('/403', req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/celebrity/:path*', '/vendor/:path*'],
};
