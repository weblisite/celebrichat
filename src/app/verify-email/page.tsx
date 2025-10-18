"use client";

import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  async function verify() {
    const res = await fetch('/api/auth/verify', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
    }
  }
  return (
    <main className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-sm text-center">
        <h1 className="mb-2 text-2xl font-semibold">Verify your email</h1>
        <p className="mb-4 text-foreground/70">We've sent a verification link to your email. Click the link to continue.</p>
        <Button onClick={verify}>I have verified my email</Button>
      </div>
    </main>
  );
}
