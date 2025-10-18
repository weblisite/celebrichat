"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bookings/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load ticket');
        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  return (
    <main className="container mx-auto max-w-xl p-6 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Your Ticket</h1>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>
      ) : booking ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground/60">Booking ID</p>
            <p className="font-mono text-sm">{booking.id}</p>
          </div>
          <div>
            <p className="text-sm text-foreground/60">Status</p>
            <p className="font-medium capitalize">{booking.status}</p>
          </div>
          <div className="mx-auto h-48 w-48 rounded-md bg-foreground/5 p-2">
            <div
              data-testid="qr"
              className="h-full w-full rounded bg-gradient-to-br from-foreground/80 to-foreground/30 opacity-80"
              title="QR Code Placeholder"
            />
          </div>
          <p className="text-sm text-foreground/60">Present this QR at the entrance.</p>
        </div>
      ) : (
        <p>Not found</p>
      )}
    </main>
  );
}
