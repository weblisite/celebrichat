import { db } from '../client';
import {
  users,
  celebrities,
  vendors,
  events,
  bookings,
  payments,
  photos,
} from '../schema';
import { eq } from 'drizzle-orm';

export async function clearAll() {
  // Delete in reverse dependency order
  await db.delete(payments);
  await db.delete(bookings);
  await db.delete(photos);
  await db.delete(events);
  await db.delete(celebrities);
  await db.delete(vendors);
  await db.delete(users);
}

export async function seedBasic() {
  // Create users
  const [alice] = await db
    .insert(users)
    .values({ name: 'Alice Customer', email: 'alice@example.com', role: 'customer' })
    .returning();
  const [bob] = await db
    .insert(users)
    .values({ name: 'Bob Celebrity', email: 'bob@example.com', role: 'celebrity' })
    .returning();
  const [vicky] = await db
    .insert(users)
    .values({ name: 'Vicky Vendor', email: 'vendor@example.com', role: 'vendor' })
    .returning();

  const [celebrity] = await db
    .insert(celebrities)
    .values({ userId: bob.id, stageName: 'Bobby B', category: 'musician', priceCents: 25000, available: true })
    .returning();

  const [vendor] = await db
    .insert(vendors)
    .values({ userId: vicky.id, companyName: 'Vicky Productions', status: 'active' })
    .returning();

  const [event] = await db
    .insert(events)
    .values({
      celebrityId: celebrity.id,
      vendorId: vendor.id,
      title: 'Meet & Greet',
      description: 'Exclusive session with Bobby B',
      eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      location: 'NYC',
      priceCents: 5000,
      status: 'published',
      metadata: { tier: 'gold' },
    })
    .returning();

  await db.insert(photos).values({ eventId: event.id, url: 'https://example.com/photo.jpg', caption: 'Promo' });

  const [booking] = await db
    .insert(bookings)
    .values({ eventId: event.id, userId: alice.id, status: 'confirmed', quantity: 2, totalCents: 10000 })
    .returning();

  await db
    .insert(payments)
    .values({
      bookingId: booking.id,
      provider: 'stripe',
      status: 'succeeded',
      amountCents: 10000,
      currency: 'USD',
      providerPaymentId: 'pi_test_123',
      rawPayload: { test: true },
    });

  return { alice, bob, vicky, celebrity, vendor, event, booking };
}
