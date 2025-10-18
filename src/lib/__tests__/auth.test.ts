import { describe, expect, it } from '@jest/globals';
import { createSessionCookie, guardRoute, hasRole, readSessionFromCookies, type Session } from '@/lib/auth';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    userId: 'u1',
    email: 'a@example.com',
    role: 'fan',
    emailVerified: false,
    ...overrides,
  };
}

describe('auth helpers', () => {
  it('serializes and reads session cookie', () => {
    const s = makeSession({ role: 'vendor', emailVerified: true });
    const cookie = createSessionCookie(s);
    const header = cookie.split(';')[0] + '; other=1;';
    const parsed = readSessionFromCookies(header);
    expect(parsed).toEqual(s);
  });

  it('hasRole respects admin override', () => {
    expect(hasRole(makeSession({ role: 'admin' }), 'vendor')).toBe(true);
    expect(hasRole(makeSession({ role: 'vendor' }), 'vendor')).toBe(true);
    expect(hasRole(makeSession({ role: 'fan' }), ['celebrity', 'vendor'])).toBe(false);
  });

  it('guardRoute redirects unauthenticated to login for protected routes', () => {
    expect(guardRoute('/admin', null)).toMatchObject({ type: 'redirect' });
    expect(guardRoute('/celebrity/tools', null)).toMatchObject({ type: 'redirect' });
  });

  it('guardRoute forces email verification', () => {
    const s = makeSession({ role: 'vendor', emailVerified: false });
    expect(guardRoute('/vendor', s)).toEqual({ type: 'redirect', location: '/verify-email' });
  });

  it('guardRoute allows when role is present and email verified', () => {
    const s = makeSession({ role: 'celebrity', emailVerified: true });
    expect(guardRoute('/celebrity', s)).toEqual({ type: 'allow' });
    expect(guardRoute('/vendor', s)).toEqual({ type: 'forbidden' });
  });
});
