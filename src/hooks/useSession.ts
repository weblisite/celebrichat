"use client";

import { useEffect, useState } from 'react';
import type { Session } from '@/lib/auth';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/session');
        const data = (await res.json()) as { session: Session | null };
        if (!active) return;
        setSession(data.session ?? null);
      } catch {
        if (!active) return;
        setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' } as const;
}
