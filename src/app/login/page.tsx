'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Something went wrong');
      return;
    }
    if (mode === 'signup') {
      setMessage('Check your email to verify your account.');
    } else {
      setMessage('Logged in. If your email is not verified, please verify to continue.');
    }
  }

  return (
    <main className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
            required
          />
          <Button type="submit" className="w-full">{mode === 'signup' ? 'Sign up' : 'Log in'}</Button>
        </form>
        <p className="mt-3 text-sm">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button className="underline" onClick={() => setMode('login')}>Log in</button>
            </>
          ) : (
            <>
              New here? <button className="underline" onClick={() => setMode('signup')}>Create an account</button>
            </>
          )}
        </p>
        {message && <p className="mt-3 text-sm text-foreground/80">{message}</p>}
      </div>
    </main>
  );
}
