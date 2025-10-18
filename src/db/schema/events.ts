import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { celebrities } from './celebrities';
import { vendors } from './vendors';
import { eventStatusEnum } from './enums';

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    celebrityId: uuid('celebrity_id')
      .notNull()
      .references(() => celebrities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    location: text('location'),
    priceCents: integer('price_cents').notNull().default(0),
    status: eventStatusEnum('status').notNull().default('draft'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    celebrityIdx: index('events_celebrity_idx').on(t.celebrityId),
    vendorIdx: index('events_vendor_idx').on(t.vendorId),
    statusIdx: index('events_status_idx').on(t.status),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  celebrity: one(celebrities, {
    fields: [events.celebrityId],
    references: [celebrities.id],
  }),
  vendor: one(vendors, {
    fields: [events.vendorId],
    references: [vendors.id],
  }),
}));
