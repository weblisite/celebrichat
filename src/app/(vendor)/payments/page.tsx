"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function VendorPaymentsPage() {
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

  async function simulatePaystack() {
    if (!vendorId) return;
    setLoading(true);
    try {
      // In a real integration, you'd initialize Paystack here and on success call the API.
      // For this demo/e2e, we directly mark as paid.
      const res = await fetch(`/api/vendors/${vendorId}/pay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Payment failed');
      setVendor(data.vendor);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Payments</h1>
      <p className="mb-8 text-foreground/70">View and complete outstanding fees.</p>

      {!vendorId && (
        <div className="rounded-md border border-foreground/20 p-4">
          <p className="font-medium">No vendor application found</p>
          <p className="text-sm text-foreground/70">Submit an application first so we can locate your payment status.</p>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Company</p>
                  <p className="font-medium">{vendor.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Status</p>
                  <p className="font-medium capitalize">{vendor.status}</p>
                </div>
              </div>
              <div className="pt-2">
                {vendor.status !== 'active' ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                    Awaiting admin approval. You will be able to pay once approved.
                  </div>
                ) : vendor.paid ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">
                    All set! Your vendor fee is paid. Proceed to Event Setup for instructions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                      Outstanding vendor fee: <span className="font-semibold">{formatMoney(vendor.feeCents)}</span>
                    </div>
                    <Button onClick={simulatePaystack}>Pay with Paystack</Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/60">We could not find your application.</p>
          )}
        </div>
      )}
    </main>
  );
}
