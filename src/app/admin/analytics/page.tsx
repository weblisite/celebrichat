"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { SummaryCards } from '@/components/analytics/SummaryCards';
import { TrendChart } from '@/components/analytics/TrendChart';
import { PayoutStatus } from '@/components/analytics/PayoutStatus';
import type { AnalyticsSummary } from '@/services/analytics';
import { Button } from '@/components/ui/button';

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const [from, setFrom] = useState<string>(() => toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState<string>(() => toDateInput(new Date()));
  const [eventId, setEventId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (eventId) params.set('eventId', eventId);
    return params.toString();
  }, [from, to, eventId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/summary?${query}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load analytics');
      setData(json.summary as AnalyticsSummary);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Analytics</h1>
        <p className="text-foreground/70">Totals and trends for ticket sales, live chat add‑ons, vendors, and payouts.</p>
      </div>

      <form
        aria-label="Filters"
        className="grid gap-3 rounded-md border border-foreground/20 p-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <label className="text-sm">
          <div className="text-foreground/60">From</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1" />
        </label>
        <label className="text-sm">
          <div className="text-foreground/60">To</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1" />
        </label>
        <label className="text-sm sm:col-span-2 lg:col-span-1">
          <div className="text-foreground/60">Event ID (optional)</div>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="uuid"
            className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1"
            aria-describedby="event-help"
          />
          <div id="event-help" className="text-xs text-foreground/60">Filter by event. Leave blank to include all.</div>
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Apply'}</Button>
        </div>
      </form>

      {loading && (
        <div role="status" aria-live="polite" className="rounded-md border border-foreground/20 p-4">Loading analytics…</div>
      )}
      {error && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>
      )}
      {data && !loading && !error && (
        <div className="space-y-4">
          <SummaryCards totals={data.totals} />
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart data={data.trend} />
            </div>
            <div>
              <PayoutStatus data={data.payouts} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
