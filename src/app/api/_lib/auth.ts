import { z } from 'zod';

export type AuthUser = {
  id: string | null;
  role: 'public' | 'customer' | 'celebrity' | 'vendor' | 'admin';
};

// Simulated Neon Auth RBAC extraction.
// In production, replace with verification of a Neon-issued JWT or session and map to a role.
// This implementation accepts either:
// - Header: x-neon-auth-role: admin|vendor|celebrity|customer
// - Authorization: Bearer role:<role>
// - Defaults to 'public'
export function getAuthUser(req: Request): AuthUser {
  const headers = req.headers;
  const roleHeader = headers.get('x-neon-auth-role');
  if (roleHeader) {
    return { id: null, role: normalizeRole(roleHeader) };
  }
  const auth = headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7);
    const m = /^role:(admin|vendor|celebrity|customer)$/i.exec(token);
    if (m) {
      return { id: null, role: normalizeRole(m[1]) };
    }
  }
  return { id: null, role: 'public' };
}

function normalizeRole(input: string): AuthUser['role'] {
  const parsed = z
    .enum(['public', 'customer', 'celebrity', 'vendor', 'admin'])
    .catch('public')
    .parse(input.toLowerCase());
  return parsed as AuthUser['role'];
}

export function requireAdmin(user: AuthUser) {
  if (user.role !== 'admin') {
    throw Object.assign(new Error('Admin role required'), { code: 'forbidden' as const });
  }
}
