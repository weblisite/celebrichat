import { db } from '@/db/client';
import { and, desc, eq } from 'drizzle-orm';
import { photos } from '@/db/schema';

export type CreatePhotoInput = { eventId: string; url: string; caption?: string | null };
export async function createPhoto(input: CreatePhotoInput) {
  const [created] = await db
    .insert(photos)
    .values({ eventId: input.eventId, url: input.url, caption: input.caption ?? null })
    .returning();
  return created;
}

export async function listPublicPhotosByEvent(eventId: string) {
  return await db.select().from(photos).where(and(eq(photos.eventId, eventId), eq(photos.isPublic, true))).orderBy(desc(photos.createdAt));
}

export async function listAllPhotosByEvent(eventId: string) {
  return await db.select().from(photos).where(eq(photos.eventId, eventId)).orderBy(desc(photos.createdAt));
}

export async function setPhotoPublic(id: string, isPublic: boolean) {
  const [updated] = await db.update(photos).set({ isPublic }).where(eq(photos.id, id)).returning();
  return updated;
}
