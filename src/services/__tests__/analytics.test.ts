import { getAnalyticsSummaryInMemory, InMemoryData } from '@/services/analytics';

function d(str: string) {
  return new Date(str);
}

describe('analytics aggregation (in-memory)', () => {
  test('computes totals, payouts, and trend', () => {
    const data: InMemoryData = {
      events: [
        { id: 'e1', eventDate: d('2024-01-10'), metadata: { vendorFeeCents: 50000 } },
        { id: 'e2', eventDate: d('2024-01-12'), metadata: { vendorFeeCents: 25000 } },
      ],
      bookings: [
        { id: 'b1', eventId: 'e1', quantity: 2, createdAt: d('2024-01-09') },
        { id: 'b2', eventId: 'e1', quantity: 1, createdAt: d('2024-01-10') },
        { id: 'b3', eventId: 'e2', quantity: 3, createdAt: d('2024-01-11') },
      ],
      payments: [
        { id: 'p1', bookingId: 'b1', status: 'succeeded', amountCents: 10000, createdAt: d('2024-01-10'), rawPayload: { liveChatCents: 500 } },
        { id: 'p2', bookingId: 'b2', status: 'succeeded', amountCents: 5000, createdAt: d('2024-01-10') },
        { id: 'p3', bookingId: 'b3', status: 'failed', amountCents: 15000, createdAt: d('2024-01-11') },
        { id: 'p4', bookingId: 'b3', status: 'succeeded', amountCents: 15000, createdAt: d('2024-01-12'), rawPayload: { liveChatCents: 200 } },
      ],
      payouts: [
        { id: 'o1', eventId: 'e1', status: 'pending', createdAt: d('2024-01-11') },
        { id: 'o2', eventId: 'e1', status: 'ready', createdAt: d('2024-01-12') },
        { id: 'o3', eventId: 'e2', status: 'paid', createdAt: d('2024-01-12') },
      ],
    };

    const summary = getAnalyticsSummaryInMemory(data, { from: d('2024-01-09'), to: d('2024-01-13') });
    expect(summary.totals.salesCents).toBe(30000);
    expect(summary.totals.liveChatCents).toBe(700);
    // Tickets: b1(2) + b2(1) + b3(3) => only include bookings with a succeeded payment in range => b1, b2, b3 => 2 + 1 + 3 = 6
    expect(summary.totals.ticketsSold).toBe(6);
    // Vendor fees: sum of vendorFeeCents across events in range
    expect(summary.totals.vendorFeesCents).toBe(75000);

    expect(summary.payouts).toEqual({ pending: 1, ready: 1, paid: 1 });

    // Trend has entries for 2024-01-10 and 2024-01-12
    expect(summary.trend).toHaveLength(2);
    const d1 = summary.trend.find((t) => t.date === '2024-01-10')!;
    expect(d1.salesCents).toBe(15000);
    expect(d1.tickets).toBe(3);
    expect(d1.liveChatCents).toBe(500);
    const d2 = summary.trend.find((t) => t.date === '2024-01-12')!;
    expect(d2.salesCents).toBe(15000);
    expect(d2.tickets).toBe(3);
  });

  test('filters by eventId', () => {
    const data: InMemoryData = {
      events: [
        { id: 'e1', eventDate: d('2024-05-10'), metadata: { vendorFeeCents: 10000 } },
        { id: 'e2', eventDate: d('2024-05-10'), metadata: { vendorFeeCents: 20000 } },
      ],
      bookings: [
        { id: 'b1', eventId: 'e1', quantity: 2, createdAt: d('2024-05-10') },
        { id: 'b2', eventId: 'e2', quantity: 1, createdAt: d('2024-05-10') },
      ],
      payments: [
        { id: 'p1', bookingId: 'b1', status: 'succeeded', amountCents: 4000, createdAt: d('2024-05-11') },
        { id: 'p2', bookingId: 'b2', status: 'succeeded', amountCents: 3000, createdAt: d('2024-05-11') },
      ],
      payouts: [],
    };

    const summary = getAnalyticsSummaryInMemory(data, { from: d('2024-05-09'), to: d('2024-05-12'), eventId: 'e1' });
    expect(summary.totals.salesCents).toBe(4000);
    expect(summary.totals.ticketsSold).toBe(2);
    expect(summary.totals.vendorFeesCents).toBe(10000);
  });
});
