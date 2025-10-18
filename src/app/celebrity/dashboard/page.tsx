"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Slot = { time: string; status: 'available' | 'blocked' | 'booked'; assigned: null | { fanName: string; fanContact: string } };

type Earnings = {
  ticketsTotalCents: number;
  liveChatTotalCents: number;
  payouts: { paidCents: number; pendingCents: number };
};

export default function CelebrityDashboardPage() {
  const [date, setDate] = useState<string>(todayStr());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [schedRes, earnRes] = await Promise.all([
        fetch(`/api/celebrity/schedule?date=${date}`),
        fetch(`/api/celebrity/earnings`),
      ]);
      const sched = await schedRes.json();
      const earn = await earnRes.json();
      setSlots((sched.data?.slots || []) as Slot[]);
      setEarnings(earn.data as Earnings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function toggleBlock(s: Slot) {
    const method = s.status === 'blocked' ? 'DELETE' : 'POST';
    const res = await fetch('/api/celebrity/slots/block', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time: s.time }),
    });
    if (res.ok) load();
  }

  const totals = useMemo(() => {
    if (!earnings) return null;
    const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
    return {
      tickets: fmt(earnings.ticketsTotalCents),
      live: fmt(earnings.liveChatTotalCents),
      paid: fmt(earnings.payouts.paidCents),
      pending: fmt(earnings.payouts.pendingCents),
    };
  }, [earnings]);

  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-semibold">Celebrity Dashboard</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Live Chat Schedule</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-foreground/20 bg-background px-3 py-2"
          />
        </div>
        <p className="text-sm text-foreground/60">15-minute slots. Click to block/unblock. Booked slots show fan contact.</p>

        <div aria-label={`Schedule for ${date}`} className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {slots.map((s) => (
            <button
              key={s.time}
              aria-label={`${s.status === 'available' ? 'Available' : s.status === 'blocked' ? 'Blocked' : 'Booked'} ${s.time}`}
              onClick={() => (s.status === 'booked' ? undefined : toggleBlock(s))}
              className={`rounded border p-2 text-left text-sm ${
                s.status === 'booked' ? 'border-blue-300 bg-blue-50' : s.status === 'blocked' ? 'border-red-300 bg-red-50' : 'border-foreground/20 hover:bg-foreground/5'
              }`}
            >
              <div className="font-mono text-xs text-foreground/70">{s.time}</div>
              {s.status === 'booked' ? (
                <div>
                  <div className="font-medium">Booked</div>
                  <div className="truncate text-xs text-foreground/70">{s.assigned?.fanName}</div>
                  <div className="truncate text-xs text-foreground/60">{s.assigned?.fanContact}</div>
                </div>
              ) : s.status === 'blocked' ? (
                <div className="font-medium text-red-700">Blocked</div>
              ) : (
                <div className="text-foreground/60">Available</div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Earnings Overview</h2>
        {totals && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card title="Tickets Share" value={totals.tickets} />
            <Card title="Live Chat Add-ons" value={totals.live} />
            <Card title="Paid Payouts" value={totals.paid} />
            <Card title="Pending Payouts" value={totals.pending} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Bookings</h2>
          <OptInQuick date={date} onBooked={load} />
        </div>
        <BookingsList date={date} />
      </section>

      {loading && <div className="text-sm text-foreground/60">Loading…</div>}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-foreground/20 p-4">
      <div className="text-sm text-foreground/60">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function OptInQuick({ date, onBooked }: { date: string; onBooked: () => void }) {
  const [name, setName] = useState('Test Fan');
  const [contact, setContact] = useState('test@example.com');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  async function book() {
    setBusy(true);
    try {
      const res = await fetch('/api/celebrity/livechat/optin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, preferredTime: time || null, fanName: name, fanContact: contact }),
      });
      if (res.ok) onBooked();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        placeholder="Fan Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-36 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
      />
      <input
        placeholder="Contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="w-40 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        step={900}
        className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
      />
      <Button size="sm" onClick={book} disabled={busy}>Add Live Chat</Button>
    </div>
  );
}

function BookingsList({ date }: { date: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/celebrity/bookings');
      const json = await res.json();
      const bookings = (json.data?.bookings || []) as any[];
      setRows(bookings);
    })();
  }, [date]);
  return (
    <div className="rounded-md border border-foreground/20">
      <table className="w-full text-sm">
        <thead className="bg-foreground/5">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Fan</th>
            <th className="p-2 text-left">Contact</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-t border-foreground/10">
              <td className="p-2">{b.date}</td>
              <td className="p-2">{b.time}</td>
              <td className="p-2">{b.fanName}</td>
              <td className="p-2">{b.fanContact}</td>
              <td className="p-2">{b.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-3 text-center text-foreground/60">No bookings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
