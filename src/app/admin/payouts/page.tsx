import Link from 'next/link';
import { createDrizzleRepoForNode } from '@/lib/payouts/service';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function updateStatus(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const to = formData.get('to') as 'ready' | 'paid';
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/payouts/${id}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to }),
  });
  revalidatePath('/admin/payouts');
}

function UpdateButton({ id, to, disabled }: { id: string; to: 'ready' | 'paid'; disabled?: boolean }) {
  return (
    <form action={updateStatus} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <button disabled={disabled} className="px-2 py-1 text-sm border rounded">
        {`Mark ${to}`}
      </button>
    </form>
  );
}

export default async function AdminPayoutsPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const repo = createDrizzleRepoForNode();
  const status = (searchParams.status as any) || undefined;
  const celebrityId = searchParams.celebrityId;
  const eventId = searchParams.eventId;
  const payouts = await repo.findPayouts({ status, celebrityId, eventId });

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Payouts</h1>
      <div className="text-sm text-gray-600">Filters: append ?status=pending|ready|paid&celebrityId=...&eventId=... to the URL</div>
      <table className="w-full text-left border mt-4">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Event</th>
            <th className="border p-2">Celebrity</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Currency</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td className="border p-2 text-xs">{p.id}</td>
              <td className="border p-2 text-xs">{p.eventId}</td>
              <td className="border p-2 text-xs">{p.celebrityId}</td>
              <td className="border p-2">{(p.amountCents / 100).toLocaleString()}</td>
              <td className="border p-2">{p.currency}</td>
              <td className="border p-2">{p.status}</td>
              <td className="border p-2 space-x-2">
                {p.status === 'pending' && <UpdateButton id={p.id} to="ready" />}
                {p.status === 'ready' && <UpdateButton id={p.id} to="paid" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pt-4">
        <Link href="/">Back home</Link>
      </div>
    </main>
  );
}
