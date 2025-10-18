import Link from 'next/link';
import { createDrizzleRepoForNode } from '@/lib/payouts/service';

export default async function CelebrityDashboardPage({ params }: { params: { id: string } }) {
  const repo = createDrizzleRepoForNode();
  const summary = await repo.getCelebritySummary(params.id);

  const formatAmount = (cents: number) => (cents / 100).toLocaleString();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Celebrity Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-600">Pending payouts</div>
          <div className="text-xl font-semibold">{summary.pending}</div>
          <div className="text-sm">KES {formatAmount(summary.totalPendingCents)}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-600">Ready to pay</div>
          <div className="text-xl font-semibold">{summary.ready}</div>
          <div className="text-sm">KES {formatAmount(summary.totalReadyCents)}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-xl font-semibold">{summary.paid}</div>
          <div className="text-sm">KES {formatAmount(summary.totalPaidCents)}</div>
        </div>
      </div>
      <div className="pt-4">
        <Link href="/">Back home</Link>
      </div>
    </main>
  );
}
