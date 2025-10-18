"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VendorApplyPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ id: string; companyName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem('vendorId');
    const company = localStorage.getItem('vendorCompanyName');
    if (existing && company) {
      setSuccess({ id: existing, companyName: company });
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactEmail, contactName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit application');
      const vendor = data.vendor as { id: string; companyName: string };
      localStorage.setItem('vendorId', vendor.id);
      localStorage.setItem('vendorCompanyName', vendor.companyName);
      localStorage.setItem('vendorEmail', contactEmail);
      setSuccess(vendor);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Vendor Application</h1>
      <p className="mb-8 text-foreground/70">Apply to participate in upcoming events. We review applications within 1-2 business days.</p>

      {success ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-medium">Thanks, {success.companyName}!</p>
          <p>Your application has been received. You can check payment status or view setup instructions while awaiting approval.</p>
          <div className="mt-4 flex gap-2">
            <a href="/payments"><Button>View Payment Status</Button></a>
            <a href="/event-setup"><Button variant="outline">Event Setup</Button></a>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="mb-1 block text-sm font-medium">Company Name</label>
            <input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactName" className="mb-1 block text-sm font-medium">Contact Name</label>
              <input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder="Jane Doe"
                  required
                />
            </div>
            <div>
              <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">Contact Email</label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="jane@acme.com"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>
          )}

          <div className="pt-2">
            <Button disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-10 text-sm text-foreground/60">
        <p>Already applied?</p>
        <p>
          Save this device. We use your browser to remember your vendor status for the demo. In production this would be linked to your account.
        </p>
      </div>
    </main>
  );
}
