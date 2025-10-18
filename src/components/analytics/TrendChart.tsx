import React from 'react';
import type { TrendPoint } from '@/services/analytics';
import { formatMoney } from './SummaryCards';

export function TrendChart({ data }: { data: TrendPoint[] }) {
  // Simple accessible bar chart using CSS with table fallback for screen readers
  const max = Math.max(1, ...data.map((d) => d.salesCents));

  return (
    <div className="rounded-md border border-foreground/20 p-4">
      <div role="img" aria-label="Sales trend by day" className="mb-3">
        <div className="flex items-end gap-1 h-40">
          {data.map((d) => {
            const h = (d.salesCents / max) * 100;
            return (
              <div key={d.date} className="flex-1">
                <div
                  className="bg-brand/60 hover:bg-brand/80 transition-colors"
                  style={{ height: `${h}%` }}
                  aria-hidden
                  title={`${d.date}: ${formatMoney(d.salesCents)} (${d.tickets} tickets)`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm" aria-label="Sales trend table">
          <thead>
            <tr className="text-foreground/60">
              <th className="p-1 text-left">Date</th>
              <th className="p-1 text-right">Sales</th>
              <th className="p-1 text-right">Tickets</th>
              <th className="p-1 text-right">Live Chat</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td className="p-1">{d.date}</td>
                <td className="p-1 text-right">{formatMoney(d.salesCents)}</td>
                <td className="p-1 text-right">{d.tickets}</td>
                <td className="p-1 text-right">{formatMoney(d.liveChatCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
