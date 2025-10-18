import React from 'react';
import type { SummaryTotals } from '@/services/analytics';

export function formatMoney(cents: number) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(abs / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SummaryCards({ totals }: { totals: SummaryTotals }) {
  const items = [
    { label: 'Ticket Sales', value: formatMoney(totals.salesCents), description: 'Total gross sales' },
    { label: 'Tickets Sold', value: String(totals.ticketsSold), description: 'Total quantity sold' },
    { label: 'Live Chat Add‑ons', value: formatMoney(totals.liveChatCents), description: 'Add‑on revenue' },
    { label: 'Vendor Fees', value: formatMoney(totals.vendorFeesCents), description: 'Configured per event' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary metrics">
      {items.map((it) => (
        <div key={it.label} className="rounded-md border border-foreground/20 p-4" role="group" aria-label={it.label}>
          <div className="text-sm text-foreground/60">{it.label}</div>
          <div className="mt-1 text-2xl font-semibold" aria-live="polite">{it.value}</div>
          <div className="mt-1 text-xs text-foreground/60">{it.description}</div>
        </div>
      ))}
    </div>
  );
}
