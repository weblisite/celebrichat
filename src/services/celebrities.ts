import { db } from '@/db/client';
import { celebrities } from '@/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';

export type ListCelebritiesParams = {
  search?: string | null;
  category?: string | null;
  available?: boolean | null;
  offset: number;
  limit: number;
};

export async function listCelebrities(params: ListCelebritiesParams) {
  const conditions = [] as any[];
  if (params.search) {
    conditions.push(ilike(celebrities.stageName, `%${params.search}%`));
  }
  if (params.category) {
    conditions.push(eq(celebrities.category, params.category as any));
  }
  if (typeof params.available === 'boolean') {
    conditions.push(eq(celebrities.available, params.available));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(celebrities)
    .where(where as any);
  const total = totalResult[0]?.count ?? 0;

  const rows = await db
    .select()
    .from(celebrities)
    .where(where as any)
    .orderBy(desc(celebrities.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total };
}

export type CreateCelebrityInput = {
  userId: string;
  stageName: string;
  bio?: string | null;
  category: 'actor' | 'athlete' | 'musician' | 'influencer' | 'comedian' | 'creator' | 'other';
  priceCents: number;
  available?: boolean;
};

export async function createCelebrity(input: CreateCelebrityInput) {
  const [created] = await db
    .insert(celebrities)
    .values({
      userId: input.userId,
      stageName: input.stageName,
      bio: input.bio ?? null,
      category: input.category,
      priceCents: input.priceCents,
      available: input.available ?? true,
    })
    .returning();
  return created;
}
