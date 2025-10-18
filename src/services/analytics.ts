import { db } from '@/db/client';
import { bookings, events, payments, payouts } from '@/db/schema';
import { and, between, count, eq, gte, lte, sql, sum } from 'drizzle-orm';

export type AnalyticsFilters = {
  from?: Date | null;
  to?: Date | null;
  eventId?: string | null;
};

export type SummaryTotals = {
  ticketsSold: number;
  salesCents: number;
  liveChatCents: number;
  vendorFeesCents: number;
};

export type PayoutStatusCounts = {
  pending: number;
  ready: number;
  paid: number;
};

export type TrendPoint = {
  date: string; // YYYY-MM-DD
  tickets: number;
  salesCents: number;
  liveChatCents: number;
};

export type AnalyticsSummary = {
  totals: SummaryTotals;
  payouts: PayoutStatusCounts;
  trend: TrendPoint[];
};

function normalizeRange(filters: AnalyticsFilters) {
  const to = filters.to ?? new Date();
  const from = filters.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to, eventId: filters.eventId ?? null };
}

export async function getAnalyticsSummary(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
  const { from, to, eventId } = normalizeRange(filters);

  const wherePayment = and(
    eq(payments.status, 'succeeded'),
    gte(payments.createdAt, from),
    lte(payments.createdAt, to),
  );

  const whereBooking = and(
    gte(bookings.createdAt, from),
    lte(bookings.createdAt, to),
  );

  // Totals
  // - Total sales: sum of succeeded payment amounts filtered by event when provided
  // - Tickets sold: sum of booking quantities for bookings that have a succeeded payment within range
  // - Live chat add-ons: sum of payments.raw_payload->>'liveChatCents' on succeeded payments
  // - Vendor fees: sum of events.metadata->>'vendorFeeCents' when present, filtered by eventDate within range

  // Build optional event filters by joining bookings
  const salesRows = await db
    .select({
      sales: sum(payments.amountCents).mapWith((x) => Number(x ?? 0)),
      liveChat: sql<number>`coalesce(sum(((raw_payload ->> 'liveChatCents')::int)), 0)`
        .mapWith((x) => Number(x ?? 0))
        .as('live_chat_cents'),
    })
    .from(payments)
    .leftJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        wherePayment,
        eventId ? eq(bookings.eventId, eventId) : sql`true`,
      ) as any,
    );

  const ticketsRows = await db
    .select({
      tickets: sql<number>`coalesce(sum(b.quantity), 0)`
        .mapWith((x) => Number(x ?? 0))
        .as('tickets'),
    })
    .from(sql`bookings b`)
    .where(
      and(
        // booking created within range
        between(sql`b.created_at`, from, to),
        eventId ? sql`b.event_id = ${eventId}` : sql`true`,
        // has at least one succeeded payment within range
        sql`exists (select 1 from payments p where p.booking_id = b.id and p.status = 'succeeded' and p.created_at >= ${from} and p.created_at <= ${to})`,
      ),
    );

  const vendorFeesRows = await db
    .select({
      vendorFees: sql<number>`coalesce(sum(((metadata ->> 'vendorFeeCents')::int)), 0)`
        .mapWith((x) => Number(x ?? 0))
        .as('vendor_fees_cents'),
    })
    .from(events)
    .where(
      and(
        gte(events.eventDate, from),
        lte(events.eventDate, to),
        eventId ? eq(events.id, eventId) : sql`true`,
      ) as any,
    );

  // Payout status counts
  const payoutRows = (await db
    .select({ status: payouts.status, count: count() })
    .from(payouts)
    .where(
      and(
        gte(payouts.createdAt, from),
        lte(payouts.createdAt, to),
        eventId ? eq(payouts.eventId, eventId) : sql`true`,
      ) as any,
    )
    .groupBy(payouts.status)) as unknown as { status: 'pending' | 'ready' | 'paid' | 'failed'; count: number }[];

  const totals: SummaryTotals = {
    salesCents: Number(salesRows[0]?.sales ?? 0),
    liveChatCents: Number(salesRows[0]?.liveChat ?? 0),
    ticketsSold: Number(ticketsRows[0]?.tickets ?? 0),
    vendorFeesCents: Number(vendorFeesRows[0]?.vendorFees ?? 0),
  };

  const payoutsSummary: PayoutStatusCounts = { pending: 0, ready: 0, paid: 0 };
  for (const r of payoutRows) {
    if (r.status === 'pending' || r.status === 'ready' || r.status === 'paid') {
      payoutsSummary[r.status] = Number(r.count ?? 0);
    }
  }

  // Daily trend using payments
  const trendRows = (await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${payments.createdAt}), 'YYYY-MM-DD')`,
      sales: sum(payments.amountCents).mapWith((x) => Number(x ?? 0)),
      liveChat: sql<number>`coalesce(sum(((raw_payload ->> 'liveChatCents')::int)), 0)`
        .mapWith((x) => Number(x ?? 0))
        .as('live_chat_cents'),
      tickets: sql<number>`coalesce(sum(b.quantity), 0)`
        .mapWith((x) => Number(x ?? 0))
        .as('tickets'),
    })
    .from(payments)
    .leftJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        wherePayment,
        eventId ? eq(bookings.eventId, eventId) : sql`true`,
      ) as any,
    )
    .groupBy(sql`date_trunc('day', ${payments.createdAt})`)
    .orderBy(sql`date_trunc('day', ${payments.createdAt})`)) as unknown as {
      day: string;
      sales: number;
      liveChat: number;
      tickets: number;
    }[];

  const trend: TrendPoint[] = trendRows.map((r) => ({
    date: r.day,
    salesCents: Number(r.sales ?? 0),
    liveChatCents: Number(r.liveChat ?? 0),
    tickets: Number(r.tickets ?? 0),
  }));

  return {
    totals,
    payouts: payoutsSummary,
    trend,
  };
}

// In-memory implementation for tests
export type InMemoryData = {
  events?: { id: string; eventDate: Date; metadata?: Record<string, any> }[];
  bookings?: { id: string; eventId: string; quantity: number; createdAt: Date }[];
  payments?: { id: string; bookingId: string; status: 'pending' | 'succeeded' | 'failed' | 'refunded'; amountCents: number; createdAt: Date; rawPayload?: Record<string, any> }[];
  payouts?: { id: string; eventId: string | null; status: 'pending' | 'ready' | 'paid' | 'failed'; createdAt: Date }[];
};

export function getAnalyticsSummaryInMemory(data: InMemoryData, filters: AnalyticsFilters = {}): AnalyticsSummary {
  const { from, to, eventId } = normalizeRange(filters);
  const paymentsInRange = (data.payments ?? []).filter((p) => p.status === 'succeeded' && p.createdAt >= from && p.createdAt <= to);
  const bookingsById = new Map((data.bookings ?? []).map((b) => [b.id, b] as const));

  const filteredPayments = paymentsInRange.filter((p) => {
    const b = bookingsById.get(p.bookingId);
    if (!b) return false;
    if (eventId && b.eventId !== eventId) return false;
    return true;
  });

  const salesCents = filteredPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
  const liveChatCents = filteredPayments.reduce((sum, p) => sum + Number(p.rawPayload?.liveChatCents || 0), 0);

  const succeededBookingIds = new Set(filteredPayments.map((p) => p.bookingId));
  let ticketsSold = 0;
  for (const id of succeededBookingIds) {
    const b = bookingsById.get(id);
    if (b && (!eventId || b.eventId === eventId) && b.createdAt >= from && b.createdAt <= to) {
      ticketsSold += b.quantity;
    }
  }

  const eventsInRange = (data.events ?? []).filter((e) => e.eventDate >= from && e.eventDate <= to);
  const vendorFeesCents = eventsInRange
    .filter((e) => !eventId || e.id === eventId)
    .reduce((sum, e) => sum + Number(e.metadata?.vendorFeeCents || 0), 0);

  const payoutsInRange = (data.payouts ?? []).filter((p) => (!eventId || p.eventId === eventId) && p.createdAt >= from && p.createdAt <= to);
  const payoutCounts: PayoutStatusCounts = { pending: 0, ready: 0, paid: 0 };
  for (const p of payoutsInRange) {
    if (p.status === 'pending' || p.status === 'ready' || p.status === 'paid') payoutCounts[p.status] += 1;
  }

  const trendMap = new Map<string, TrendPoint>();
  for (const p of filteredPayments) {
    const key = p.createdAt.toISOString().slice(0, 10);
    const b = bookingsById.get(p.bookingId)!;
    const cur = trendMap.get(key) || { date: key, tickets: 0, salesCents: 0, liveChatCents: 0 };
    cur.salesCents += p.amountCents;
    cur.liveChatCents += Number(p.rawPayload?.liveChatCents || 0);
    cur.tickets += b.quantity;
    trendMap.set(key, cur);
  }

  const trend = Array.from(trendMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    totals: { ticketsSold, salesCents, liveChatCents, vendorFeesCents },
    payouts: payoutCounts,
    trend,
  };
}
