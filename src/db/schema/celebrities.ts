import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { celebrityCategoryEnum } from './enums';
import { users } from './users';

export const celebrities = pgTable(
  'celebrities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    stageName: text('stage_name').notNull(),
    bio: text('bio'),
    category: celebrityCategoryEnum('category').notNull().default('other'),
    priceCents: integer('price_cents').notNull().default(0),
    available: boolean('available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUnique: uniqueIndex('celebrities_user_unique').on(t.userId),
    categoryIdx: index('celebrities_category_idx').on(t.category),
  }),
);

export const celebritiesRelations = relations(celebrities, ({ one, many }) => ({
  user: one(users, {
    fields: [celebrities.userId],
    references: [users.id],
  }),
}));
