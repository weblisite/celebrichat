import { createHmac } from 'crypto';

export function makeSessionCookieValue(session: any) {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

export function makeAdminAuthHeaders(): Record<string, string> {
  return { 'x-neon-auth-role': 'admin' };
}

export function makePaystackSignature(secret: string, payload: unknown): string {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return createHmac('sha512', secret).update(body).digest('hex');
}
