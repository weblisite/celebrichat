"use client";

import type { AppRole, Session } from '@/lib/auth';
import { useSession } from '@/hooks/useSession';

export function RoleGate({ allow, children, fallback }: { allow: AppRole[] | AppRole; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { data, status } = useSession();
  const allowed = new Set(Array.isArray(allow) ? allow : [allow]);

  if (status === 'loading') return null;
  if (!data) return fallback ?? null;
  if (data.role === 'admin') return <>{children}</>;
  if (!data.emailVerified) return fallback ?? null;
  if (!allowed.has(data.role)) return fallback ?? null;
  return <>{children}</>;
}

export function RequireVerified({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { data, status } = useSession();
  if (status === 'loading') return null;
  if (!data || !data.emailVerified) return fallback ?? null;
  return <>{children}</>;
}
