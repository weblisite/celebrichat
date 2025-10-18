"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VendorEventSetupPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('vendorId');
    setVendorId(id);
  }, []);

  useEffect(() => {
    async function fetchVendor() {
      if (!vendorId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/vendors/${vendorId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load vendor');
        setVendor(data.vendor);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [vendorId]);

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Event Setup</h1>
      <p className="mb-8 text-foreground/70">Instructions and assets to prepare for the event.</p>

      {!vendorId && (
        <div className="rounded-md border border-foreground/20 p-4">
          <p className="font-medium">No vendor record found</p>
          <p className="text-sm text-foreground/70">Submit an application first so we can customize instructions for you.</p>
          <div className="mt-3"><a href="/apply"><Button>Go to Application</Button></a></div>
        </div>
      )}

      {vendorId && (
        <div className="rounded-md border border-foreground/20 p-4">
          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>
          ) : vendor ? (
            <div className="space-y-6">
              {vendor.status !== 'active' ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                  Your application is still pending approval. You will receive setup instructions after approval and payment.
                </div>
              ) : !vendor.paid ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                  You are approved! Please complete your payment to unlock event instructions and assets.
                </div>
              ) : (
                <>
                  <section>
                    <h2 className="mb-2 text-xl font-semibold">Checklist</h2>
                    <ul className="list-disc space-y-1 pl-5">
                      {vendor.instructions?.map((it: string, idx: number) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h2 className="mb-2 text-xl font-semibold">Assets</h2>
                    <ul className="space-y-2">
                      {vendor.eventAssets?.map((f: any) => (
                        <li key={f.url} className="flex items-center justify-between rounded-md border border-foreground/10 p-2">
                          <span>{f.name}</span>
                          <a className="text-brand underline" href={f.url} target="_blank" rel="noreferrer">Download</a>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground/60">We could not find your application.</p>
          )}
        </div>
      )}
    </main>
  );
}
