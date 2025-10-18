/** @jest-environment node */
import { createInMemoryRepo, processCompletedEvents, transitionPayout, DEFAULT_PAYOUT_AMOUNT_CENTS } from '@/lib/payouts/service';

describe('Payout lifecycle', () => {
  test('creates payout on event completion', async () => {
    const celebrityId = 'celebrity_1';
    const eventId = 'event_1';
    const repo = createInMemoryRepo({ events: [{ celebrityId, eventId }] });

    const result = await processCompletedEvents(repo);
    expect(result.createdCount).toBe(1);
    expect(repo.payouts).toHaveLength(1);
    const p = repo.payouts[0];
    expect(p.celebrityId).toBe(celebrityId);
    expect(p.eventId).toBe(eventId);
    expect(p.status).toBe('pending');
    expect(p.amountCents).toBe(DEFAULT_PAYOUT_AMOUNT_CENTS);
    expect(p.currency).toBe('KES');

    // idempotent when run again
    const result2 = await processCompletedEvents(repo);
    expect(result2.createdCount).toBe(0);
    expect(repo.payouts).toHaveLength(1);
  });

  test('status transitions and paid_at', async () => {
    const celebrityId = 'celebrity_1';
    const eventId = 'event_1';
    const repo = createInMemoryRepo({ events: [{ celebrityId, eventId }] });

    await processCompletedEvents(repo);
    const p = repo.payouts[0];

    const ready = await transitionPayout(repo, p.id, 'ready');
    expect(ready.status).toBe('ready');
    expect(repo.notifications).toHaveLength(1);
    expect(repo.notifications[0]).toMatchObject({ payoutId: p.id, type: 'payout_ready' });

    const paid = await transitionPayout(repo, p.id, 'paid');
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();

    // invalid transitions
    await expect(transitionPayout(repo, p.id, 'ready')).rejects.toThrow(/invalid/i);
  });
});
