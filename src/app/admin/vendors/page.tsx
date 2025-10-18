"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

function useAdminGate() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('admin') === '1') {
      localStorage.setItem('role', 'admin');
    }
    setIsAdmin(localStorage.getItem('role') === 'admin');
  }, []);
  return { isAdmin, enable: () => { localStorage.setItem('role', 'admin'); window.location.replace('/admin/vendors'); } };
}

export default function AdminVendorsPage() {
  const { isAdmin, enable } = useAdminGate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setVendors(data.vendors || []);
      if (selected) {
        const updated = data.vendors.find((v: any) => v.id === selected.id);
        setSelected(updated || null);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const id = setInterval(load, 2000); // poll for updates (e.g., payment status)
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function approve(id: string) {
    await fetch(`/api/vendors/${id}/approve`, { method: 'POST' });
    await load();
  }

  if (!isAdmin) {
    return (
      <main className="container mx-auto max-w-4xl p-6">
        <h1 className="mb-2 text-3xl font-semibold">Admin • Vendors</h1>
        <p className="mb-6 text-foreground/70">Restricted area. Admin access is required.</p>
        <div className="rounded-md border border-foreground/20 p-4">
          <p className="mb-2 text-sm text-foreground/70">For this demo, enable admin mode locally:</p>
          <div className="flex gap-2">
            <Button onClick={enable}>Enable Admin</Button>
            <a href="/apply"><Button variant="outline">Back to Apply</Button></a>
          </div>
        </div>
      </main>
    );
  }

  const pending = useMemo(() => vendors.filter((v) => v.status === 'pending'), [vendors]);

  return (
    <main className="container mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Admin • Vendors</h1>
      <p className="mb-6 text-foreground/70">Review applications, approve vendors, and monitor fee payments.</p>

      {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-md border border-foreground/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Applications</h2>
            <Button onClick={load} variant="outline" size="sm">Refresh</Button>
          </div>
          {loading && vendors.length === 0 ? (
            <p>Loading…</p>
          ) : pending.length === 0 ? (
            <div className="rounded-md border border-foreground/10 p-3 text-sm text-foreground/60">No pending applications</div>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {pending.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{v.companyName}</p>
                    <p className="text-sm text-foreground/60">{v.contactName} • {v.contactEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setSelected(v)}>Details</Button>
                    <Button size="sm" onClick={() => approve(v.id)}>Approve</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-foreground/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Vendors</h2>
          </div>
          {vendors.length === 0 ? (
            <div className="rounded-md border border-foreground/10 p-3 text-sm text-foreground/60">No vendors yet</div>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {vendors.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{v.companyName}</p>
                    <p className="text-sm text-foreground/60">{v.contactName} • {v.contactEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${v.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>{v.status}</span>
                    <span className={`text-sm ${v.paid ? 'text-emerald-600' : 'text-amber-600'}`}>{v.paid ? 'paid' : 'unpaid'}</span>
                    <Button size="sm" onClick={() => setSelected(v)}>Details</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-foreground/20 bg-background p-5 shadow-xl transition-transform duration-200 ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Vendor Details</h3>
          <button className="text-sm text-foreground/60" onClick={() => setSelected(null)}>Close</button>
        </div>
        {!selected ? (
          <div className="mt-6 text-sm text-foreground/60">Select a vendor to view details</div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-foreground/60">Company</p>
              <p className="font-medium">{selected.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Contact</p>
              <p className="font-medium">{selected.contactName} • {selected.contactEmail}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60">Status</p>
                <p className="font-medium capitalize">{selected.status}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60">Payment</p>
                <p className="font-medium">{selected.paid ? 'Paid' : 'Unpaid'}</p>
              </div>
            </div>
            {selected.status !== 'active' ? (
              <Button onClick={() => approve(selected.id)}>Approve & Set Fee</Button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md border border-foreground/10 p-3 text-sm">
                  Fee Due: <span className="font-semibold">${(selected.feeCents / 100).toFixed(2)}</span>
                </div>
                <p className="text-sm text-foreground/60">Monitoring for payment… This view refreshes automatically.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
}
