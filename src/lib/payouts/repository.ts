import { and, count, eq, isNull, sql, sum } from 'drizzle-orm';
import { db as pooledDb, serverlessDb } from '@/db/client';
import { celebrities, events, payouts, payoutNotifications } from '@/db/schema';

export type PayoutStatus = 'pending' | 'ready' | 'paid' | 'failed';

export interface CompletedEventRef {
  eventId: string;
  celebrityId: string;
}

export interface PayoutRecord {
  id: string;
  eventId: string | null;
  celebrityId: string | null;
  status: PayoutStatus;
  amountCents: number;
  currency: string;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayoutFilters {
  status?: PayoutStatus;
  celebrityId?: string;
  eventId?: string;
}

export interface PayoutRepository {
  getCompletedEventsWithoutPayouts(): Promise<CompletedEventRef[]>;
  createPayout(input: { eventId: string; celebrityId: string; amountCents: number; currency: string }): Promise<PayoutRecord>;
  getPayoutById(id: string): Promise<PayoutRecord | null>;
  updatePayoutStatus(id: string, to: PayoutStatus, paidAt?: Date | null): Promise<PayoutRecord>;
  findPayouts(filters?: PayoutFilters): Promise<PayoutRecord[]>;
  getCelebritySummary(celebrityId: string): Promise<{ pending: number; ready: number; paid: number; totalPendingCents: number; totalReadyCents: number; totalPaidCents: number }>;
  logNotification(payoutId: string, type: string, message: string): Promise<void>;
}

export class DrizzlePayoutRepository implements PayoutRepository {
  private db = pooledDb; // default to pooled for Node runtimes

  constructor(opts?: { edge?: boolean }) {
    if (opts?.edge) {
      // Use Neon HTTP for edge/serverless
      // @ts-ignore
      this.db = serverlessDb;
    }
  }

  async getCompletedEventsWithoutPayouts(): Promise<CompletedEventRef[]> {
    const rows = await this.db
      .select({ eventId: events.id, celebrityId: events.celebrityId })
      .from(events)
      .leftJoin(
        payouts,
        and(eq(payouts.eventId, events.id), eq(payouts.celebrityId, events.celebrityId))
      )
      .where(and(eq(events.status, 'completed'), isNull(payouts.id)));

    return rows.map((r) => ({ eventId: r.eventId, celebrityId: r.celebrityId }));
  }

  async createPayout(input: { eventId: string; celebrityId: string; amountCents: number; currency: string }): Promise<PayoutRecord> {
    // check for existing first
    const existing = await this.db
      .select({ id: payouts.id })
      .from(payouts)
      .where(and(eq(payouts.eventId, input.eventId), eq(payouts.celebrityId, input.celebrityId)));
    if (existing.length > 0) {
      const [row] = await this.db
        .select()
        .from(payouts)
        .where(eq(payouts.id, existing[0].id));
      return this.mapRow(row);
    }

    const [row] = await this.db
      .insert(payouts)
      .values({
        eventId: input.eventId,
        celebrityId: input.celebrityId,
        status: 'pending',
        amountCents: input.amountCents,
        currency: input.currency,
      })
      .returning();

    return this.mapRow(row);
  }

  async getPayoutById(id: string): Promise<PayoutRecord | null> {
    const [row] = await this.db.select().from(payouts).where(eq(payouts.id, id));
    return row ? this.mapRow(row) : null;
  }

  async updatePayoutStatus(id: string, to: PayoutStatus, paidAt?: Date | null): Promise<PayoutRecord> {
    const [row] = await this.db
      .update(payouts)
      .set({ status: to, paidAt: to === 'paid' ? paidAt ?? new Date() : null, updatedAt: sql`now()` })
      .where(eq(payouts.id, id))
      .returning();
    return this.mapRow(row);
  }

  async findPayouts(filters?: PayoutFilters): Promise<PayoutRecord[]> {
    let where = sql`1=1`;
    if (filters?.status) {
      where = sql`${where} AND ${payouts.status} = ${filters.status}`;
    }
    if (filters?.celebrityId) {
      where = sql`${where} AND ${payouts.celebrityId} = ${filters.celebrityId}`;
    }
    if (filters?.eventId) {
      where = sql`${where} AND ${payouts.eventId} = ${filters.eventId}`;
    }

    const rows = await this.db.select().from(payouts).where(where).orderBy(payouts.createdAt);
    return rows.map((r: any) => this.mapRow(r));
  }

  async getCelebritySummary(celebrityId: string): Promise<{ pending: number; ready: number; paid: number; totalPendingCents: number; totalReadyCents: number; totalPaidCents: number }>{
    const group = await this.db
      .select({ status: payouts.status, count: count(), total: sum(payouts.amountCents) })
      .from(payouts)
      .where(eq(payouts.celebrityId, celebrityId))
      .groupBy(payouts.status);

    const acc = { pending: 0, ready: 0, paid: 0, totalPendingCents: 0, totalReadyCents: 0, totalPaidCents: 0 };
    for (const row of group as any[]) {
      if (row.status === 'pending') {
        acc.pending = Number(row.count);
        acc.totalPendingCents = Number(row.total ?? 0);
      } else if (row.status === 'ready') {
        acc.ready = Number(row.count);
        acc.totalReadyCents = Number(row.total ?? 0);
      } else if (row.status === 'paid') {
        acc.paid = Number(row.count);
        acc.totalPaidCents = Number(row.total ?? 0);
      }
    }
    return acc;
  }

  async logNotification(payoutId: string, type: string, message: string): Promise<void> {
    await this.db.insert(payoutNotifications).values({ payoutId, type, message });
  }

  private mapRow(row: any): PayoutRecord {
    return {
      id: row.id,
      eventId: row.eventId ?? null,
      celebrityId: row.celebrityId ?? null,
      status: row.status,
      amountCents: row.amountCents,
      currency: row.currency,
      paidAt: row.paidAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// In-memory repository for tests
export class InMemoryPayoutRepository implements PayoutRepository {
  events: CompletedEventRef[] = [];
  payouts: PayoutRecord[] = [];
  notifications: { payoutId: string; type: string; message: string }[] = [];

  async getCompletedEventsWithoutPayouts(): Promise<CompletedEventRef[]> {
    return this.events.filter((e) => !this.payouts.find((p) => p.eventId === e.eventId && p.celebrityId === e.celebrityId));
  }

  async createPayout(input: { eventId: string; celebrityId: string; amountCents: number; currency: string }): Promise<PayoutRecord> {
    const exists = this.payouts.find((p) => p.eventId === input.eventId && p.celebrityId === input.celebrityId);
    if (exists) return exists;
    const rec: PayoutRecord = {
      id: `p_${Math.random().toString(36).slice(2)}`,
      eventId: input.eventId,
      celebrityId: input.celebrityId,
      status: 'pending',
      amountCents: input.amountCents,
      currency: input.currency,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payouts.push(rec);
    return rec;
  }

  async getPayoutById(id: string): Promise<PayoutRecord | null> {
    return this.payouts.find((p) => p.id === id) ?? null;
  }

  async updatePayoutStatus(id: string, to: PayoutStatus, paidAt?: Date | null): Promise<PayoutRecord> {
    const p = this.payouts.find((x) => x.id === id);
    if (!p) throw new Error('not found');
    p.status = to;
    p.paidAt = to === 'paid' ? paidAt ?? new Date() : null;
    p.updatedAt = new Date();
    return p;
  }

  async findPayouts(filters?: PayoutFilters): Promise<PayoutRecord[]> {
    return this.payouts.filter((p) => {
      if (filters?.status && p.status !== filters.status) return false;
      if (filters?.celebrityId && p.celebrityId !== filters.celebrityId) return false;
      if (filters?.eventId && p.eventId !== filters.eventId) return false;
      return true;
    });
  }

  async getCelebritySummary(celebrityId: string) {
    const arr = this.payouts.filter((p) => p.celebrityId === celebrityId);
    const res = { pending: 0, ready: 0, paid: 0, totalPendingCents: 0, totalReadyCents: 0, totalPaidCents: 0 };
    for (const p of arr) {
      if (p.status === 'pending') {
        res.pending += 1;
        res.totalPendingCents += p.amountCents;
      } else if (p.status === 'ready') {
        res.ready += 1;
        res.totalReadyCents += p.amountCents;
      } else if (p.status === 'paid') {
        res.paid += 1;
        res.totalPaidCents += p.amountCents;
      }
    }
    return res;
  }

  async logNotification(payoutId: string, type: string, message: string): Promise<void> {
    this.notifications.push({ payoutId, type, message });
  }
}
