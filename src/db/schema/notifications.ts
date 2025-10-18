import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { payouts } from './payouts';

export const payoutNotifications = pgTable(
  'payout_notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payoutId: uuid('payout_id').references(() => payouts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    payoutIdx: index('payout_notifications_payout_idx').on(t.payoutId),
    typeIdx: index('payout_notifications_type_idx').on(t.type),
  }),
);
