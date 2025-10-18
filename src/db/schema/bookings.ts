import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { events } from './events';
import { users } from './users';
import { bookingStatusEnum } from './enums';

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: bookingStatusEnum('status').notNull().default('pending'),
    quantity: integer('quantity').notNull().default(1),
    totalCents: integer('total_cents').notNull(),
    isLiveChat: boolean('is_live_chat').notNull().default(false),
    qrToken: text('qr_token'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    eventIdx: index('bookings_event_idx').on(t.eventId),
    userIdx: index('bookings_user_idx').on(t.userId),
    statusIdx: index('bookings_status_idx').on(t.status),
    uniqByUserEventLiveChat: uniqueIndex('bookings_user_event_live_unique').on(t.userId, t.eventId, t.isLiveChat),
  }),
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));
