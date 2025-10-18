import { relations } from 'drizzle-orm';
import { char, check, index, integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';
import { celebrities } from './celebrities';
import { payoutStatusEnum } from './enums';
import { events } from './events';

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    celebrityId: uuid('celebrity_id').references(() => celebrities.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    status: payoutStatusEnum('status').notNull().default('pending'),
    amountCents: integer('amount_cents').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    providerPayoutId: text('provider_payout_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipientCheck: check('payouts_recipient_check', '(vendor_id is not null) <> (celebrity_id is not null)'),
    vendorIdx: index('payouts_vendor_idx').on(t.vendorId),
    celebrityIdx: index('payouts_celebrity_idx').on(t.celebrityId),
    eventIdx: index('payouts_event_idx').on(t.eventId),
    providerPayoutUnique: uniqueIndex('payouts_provider_payout_unique').on(t.providerPayoutId),
    // Note: partial unique index on (event_id, celebrity_id) is created via SQL migration
  }),
);

export const payoutsRelations = relations(payouts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [payouts.vendorId],
    references: [vendors.id],
  }),
  celebrity: one(celebrities, {
    fields: [payouts.celebrityId],
    references: [celebrities.id],
  }),
  event: one(events, {
    fields: [payouts.eventId],
    references: [events.id],
  }),
}));
