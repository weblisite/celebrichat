import { db } from '@/db/client';
import { bookings, events, users } from '@/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

export type CreateBookingInput = {
  eventId: string;
  userId: string;
  quantity: number;
  totalCents: number;
  isLiveChat?: boolean;
  notes?: string | null;
  qrToken?: string | null;
};

export async function createOrGetBooking(input: CreateBookingInput) {
  // Check event availability
  const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
  if (!event) {
    const err = new Error('Event not found');
    (err as any).code = 'not_found';
    throw err;
  }
  if (event.status !== 'published' || new Date(event.eventDate).getTime() < Date.now()) {
    const err = new Error('Event not available');
    (err as any).code = 'bad_request';
    throw err;
  }

  // Try fetch existing by unique key
  const [existing] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.userId, input.userId), eq(bookings.eventId, input.eventId), eq(bookings.isLiveChat, Boolean(input.isLiveChat))))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(bookings)
    .values({
      eventId: input.eventId,
      userId: input.userId,
      quantity: input.quantity,
      totalCents: input.totalCents,
      isLiveChat: Boolean(input.isLiveChat),
      notes: input.notes ?? null,
      qrToken: input.qrToken ?? null,
    })
    .returning();
  return created;
}

export async function listBookingsForUser(userId: string) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));
  return rows;
}
