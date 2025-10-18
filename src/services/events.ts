import { db } from '@/db/client';
import { events } from '@/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';

export type ListEventsParams = {
  search?: string | null;
  status?: 'draft' | 'published' | 'cancelled' | 'completed' | null;
  celebrityId?: string | null;
  from?: Date | null;
  to?: Date | null;
  offset: number;
  limit: number;
};

export async function listEvents(params: ListEventsParams) {
  const conditions = [] as any[];
  if (params.search) {
    conditions.push(ilike(events.title, `%${params.search}%`));
  }
  if (params.status) {
    conditions.push(eq(events.status, params.status));
  }
  if (params.celebrityId) {
    conditions.push(eq(events.celebrityId, params.celebrityId));
  }
  if (params.from) {
    conditions.push(sql`event_date >= ${params.from}`);
  }
  if (params.to) {
    conditions.push(sql`event_date <= ${params.to}`);
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(events)
    .where(where as any);
  const total = totalResult[0]?.count ?? 0;

  const rows = await db
    .select()
    .from(events)
    .where(where as any)
    .orderBy(desc(events.eventDate))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total };
}

export type CreateEventInput = {
  celebrityId: string;
  vendorId?: string | null;
  title: string;
  description?: string | null;
  eventDate: Date;
  location?: string | null;
  priceCents: number;
  metadata?: Record<string, unknown> | null;
};

export async function createEvent(input: CreateEventInput) {
  const metadata = {
    sessions: createDefaultSessions(),
    ...(input.metadata ?? {}),
  } as Record<string, unknown>;
  const [created] = await db
    .insert(events)
    .values({
      celebrityId: input.celebrityId,
      vendorId: input.vendorId ?? null,
      title: input.title,
      description: input.description ?? null,
      eventDate: input.eventDate,
      location: input.location ?? null,
      priceCents: input.priceCents,
      // status defaults to 'draft' in schema
      metadata,
    })
    .returning();
  return created;
}

export type UpdateEventInput = {
  id: string;
  expectedUpdatedAt: Date;
  patch: Partial<{
    vendorId: string | null;
    title: string;
    description: string | null;
    eventDate: Date;
    location: string | null;
    priceCents: number;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    metadata: Record<string, unknown>;
  }>;
};

export async function updateEvent(input: UpdateEventInput) {
  const existing = (
    await db.select().from(events).where(eq(events.id, input.id)).limit(1)
  )[0];
  if (!existing) {
    const err = new Error('Event not found');
    (err as any).code = 'not_found';
    throw err;
  }
  // optimistic concurrency check
  if (existing.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
    const err = new Error('Event has been modified by another process');
    (err as any).code = 'conflict';
    (err as any).currentUpdatedAt = existing.updatedAt;
    throw err;
  }
  // validate status transition
  if (input.patch.status) {
    const next = input.patch.status;
    if (!isAllowedStatusTransition(existing.status as any, next)) {
      const err = new Error(`Invalid status transition from ${existing.status} to ${next}`);
      (err as any).code = 'bad_request';
      throw err;
    }
  }
  const [updated] = await db
    .update(events)
    .set({
      ...input.patch,
      updatedAt: new Date(),
    })
    .where(eq(events.id, input.id))
    .returning();
  return updated;
}

export function createDefaultSessions() {
  // Fixed five-session template
  const now = new Date();
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `session-${i + 1}`,
    title: `Session ${i + 1}`,
    startTime: new Date(now.getTime() + i * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + (i + 1) * 60 * 60 * 1000).toISOString(),
    speakerId: null as string | null,
  }));
}

export function isAllowedStatusTransition(
  from: 'draft' | 'published' | 'cancelled' | 'completed',
  to: 'draft' | 'published' | 'cancelled' | 'completed',
) {
  const allowed: Record<string, string[]> = {
    draft: ['published', 'cancelled'],
    published: ['completed', 'cancelled'],
    cancelled: [],
    completed: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
