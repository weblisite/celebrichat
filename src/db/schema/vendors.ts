import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { vendorStatusEnum } from './enums';

export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    companyName: text('company_name').notNull(),
    stripeAccountId: text('stripe_account_id'),
    status: vendorStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUnique: uniqueIndex('vendors_user_unique').on(t.userId),
    stripeAccountUnique: uniqueIndex('vendors_stripe_acct_unique').on(t.stripeAccountId),
    statusIdx: index('vendors_status_idx').on(t.status),
  }),
);

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
}));
