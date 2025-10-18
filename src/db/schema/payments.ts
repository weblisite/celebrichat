import { relations } from 'drizzle-orm';
import { char, index, integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { paymentProviderEnum, paymentStatusEnum } from './enums';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull().default('stripe'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amountCents: integer('amount_cents').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    providerPaymentId: text('provider_payment_id'),
    rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index('payments_booking_idx').on(t.bookingId),
    providerPaymentUnique: uniqueIndex('payments_provider_payment_unique').on(t.providerPaymentId),
    statusIdx: index('payments_status_idx').on(t.status),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));
