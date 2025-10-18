import React from 'react';
import type { PayoutStatusCounts } from '@/services/analytics';

export function PayoutStatus({ data }: { data: PayoutStatusCounts }) {
  const items = [
    { key: 'pending', label: 'Pending', value: data.pending, color: 'bg-amber-500' },
    { key: 'ready', label: 'Ready', value: data.ready, color: 'bg-blue-500' },
    { key: 'paid', label: 'Paid', value: data.paid, color: 'bg-emerald-600' },
  ] as const;

  const total = items.reduce((s, it) => s + it.value, 0) || 1;

  return (
    <div className="rounded-md border border-foreground/20 p-4">
      <div className="mb-2 text-sm text-foreground/60">Payout status</div>
      <div role="img" aria-label="Payout statuses" className="flex h-6 w-full overflow-hidden rounded">
        {items.map((it) => (
          <div key={it.key} className={`${it.color}`} style={{ width: `${(it.value / total) * 100}%` }} aria-hidden />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 text-sm">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded ${it.color}`} aria-hidden />
            <span className="text-foreground/60">{it.label}</span>
            <span className="font-medium" aria-live="polite">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
