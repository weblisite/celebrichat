/*
Server-side auth and RBAC helpers.
- Lightweight cookie-based session helpers (framework-agnostic Request/Response)
- Role utilities with mapping to DB enum (customer <-> fan)
- Guard helpers that can be used from middleware and route handlers
*/

export type AppRole = 'fan' | 'celebrity' | 'vendor' | 'admin';
export type DbRole = 'customer' | 'celebrity' | 'vendor' | 'admin';

export interface Session {
  userId: string;
  email: string;
  role: AppRole;
  emailVerified: boolean;
}

export const ROLE_ORDER: AppRole[] = ['fan', 'celebrity', 'vendor', 'admin'];

export const mapDbRoleToApp = (role: DbRole): AppRole => (role === 'customer' ? 'fan' : role);
export const mapAppRoleToDb = (role: AppRole): DbRole => (role === 'fan' ? 'customer' : role);

export function parseCookies(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx).trim());
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

export function readSessionFromCookies(cookieHeader: string | null | undefined): Session | null {
  const cookies = parseCookies(cookieHeader);
  const raw = cookies['session'];
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    // Basic shape validation
    if (!obj.userId || !obj.email || typeof obj.emailVerified !== 'boolean' || !obj.role) return null;
    return {
      userId: String(obj.userId),
      email: String(obj.email),
      role: String(obj.role) as AppRole,
      emailVerified: Boolean(obj.emailVerified),
    } satisfies Session;
  } catch {
    return null;
  }
}

export function createSessionCookie(session: Session, options?: { maxAgeDays?: number }): string {
  const { maxAgeDays = 30 } = options || {};
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const parts = [
    `session=${payload}`,
    'Path=/',
    // In a real app set Secure except on localhost
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  return parts.join('; ');
}

export function destroySessionCookie(): string {
  return ['session=','Path=/','HttpOnly','SameSite=Lax','Max-Age=0','Expires=Thu, 01 Jan 1970 00:00:00 GMT'].join('; ');
}

export function hasRole(session: Session | null | undefined, allowed: AppRole | AppRole[]): boolean {
  if (!session) return false;
  const allowedSet = new Set(Array.isArray(allowed) ? allowed : [allowed]);
  if (session.role === 'admin') return true; // Admin override
  return allowedSet.has(session.role);
}

export function isEmailVerified(session: Session | null | undefined): boolean {
  return Boolean(session && session.emailVerified);
}

export type GuardDecision =
  | { type: 'allow' }
  | { type: 'redirect'; location: string }
  | { type: 'forbidden' };

export function guardRoute(pathname: string, session: Session | null): GuardDecision {
  const requireVerified = (p: string) => p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/celebrity');
  if (!session) {
    // Unauthenticated to protected routes -> login
    if (requireVerified(pathname)) return { type: 'redirect', location: `/login?next=${encodeURIComponent(pathname)}` };
    return { type: 'allow' };
  }
  if (requireVerified(pathname) && !session.emailVerified) {
    return { type: 'redirect', location: '/verify-email' };
  }
  if (pathname.startsWith('/admin')) {
    return hasRole(session, 'admin') ? { type: 'allow' } : { type: 'forbidden' };
  }
  if (pathname.startsWith('/vendor')) {
    return hasRole(session, ['vendor', 'admin']) ? { type: 'allow' } : { type: 'forbidden' };
  }
  if (pathname.startsWith('/celebrity')) {
    return hasRole(session, ['celebrity', 'admin']) ? { type: 'allow' } : { type: 'forbidden' };
  }
  return { type: 'allow' };
}

export function requireRole<T>(session: Session | null | undefined, allowed: AppRole | AppRole[], message = 'Forbidden'): asserts session is Session {
  if (!session) throw new Error('Unauthenticated');
  if (!hasRole(session, allowed)) throw new Error(message);
}

export function requireVerified<T>(session: Session | null | undefined): asserts session is Session {
  if (!session) throw new Error('Unauthenticated');
  if (!session.emailVerified) throw new Error('Email not verified');
}

// Convenience for Web Fetch API Request
export function getSessionFromRequest(req: Pick<Request, 'headers'>): Session | null {
  const cookieHeader = req.headers.get('cookie');
  return readSessionFromCookies(cookieHeader);
}
