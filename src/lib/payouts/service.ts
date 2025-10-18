import { DrizzlePayoutRepository, InMemoryPayoutRepository, PayoutRepository, PayoutStatus } from './repository';

export const DEFAULT_PAYOUT_AMOUNT_KSH = 25_000; // KSh
export const DEFAULT_PAYOUT_AMOUNT_CENTS = DEFAULT_PAYOUT_AMOUNT_KSH * 100; // store in minor units
export const DEFAULT_CURRENCY = 'KES';

export async function processCompletedEvents(repo: PayoutRepository) {
  const completed = await repo.getCompletedEventsWithoutPayouts();
  const created: string[] = [];
  for (const e of completed) {
    const rec = await repo.createPayout({
      eventId: e.eventId,
      celebrityId: e.celebrityId,
      amountCents: DEFAULT_PAYOUT_AMOUNT_CENTS,
      currency: DEFAULT_CURRENCY,
    });
    created.push(rec.id);
  }
  return { createdCount: created.length, createdIds: created };
}

export async function transitionPayout(repo: PayoutRepository, payoutId: string, to: PayoutStatus) {
  const current = await repo.getPayoutById(payoutId);
  if (!current) throw new Error('Payout not found');

  if (to === current.status) return current;

  if (current.status === 'pending' && to !== 'ready') {
    throw new Error('Invalid transition: pending -> ' + to);
  }
  if (current.status === 'ready' && to !== 'paid') {
    throw new Error('Invalid transition: ready -> ' + to);
  }
  if (current.status === 'paid') {
    throw new Error('Invalid transition: already paid');
  }

  const updated = await repo.updatePayoutStatus(payoutId, to);

  if (to === 'ready') {
    // Log notification for ready state
    await repo.logNotification(payoutId, 'payout_ready', `Payout ${payoutId} is ready for disbursement.`);
    // eslint-disable-next-line no-console
    console.log(`Payout ${payoutId} marked as READY`);
  }

  if (to === 'paid') {
    const paid = await repo.updatePayoutStatus(payoutId, 'paid', new Date());
    return paid;
  }

  return updated;
}

// Convenience constructors
export function createDrizzleRepoForEdge() {
  return new DrizzlePayoutRepository({ edge: true });
}
export function createDrizzleRepoForNode() {
  return new DrizzlePayoutRepository();
}
export function createInMemoryRepo(initial?: { events?: { eventId: string; celebrityId: string }[] }) {
  const repo = new InMemoryPayoutRepository();
  if (initial?.events) {
    repo.events = initial.events;
  }
  return repo;
}
