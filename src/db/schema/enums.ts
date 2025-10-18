import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'celebrity', 'vendor', 'admin']);

export const celebrityCategoryEnum = pgEnum('celebrity_category', [
  'actor',
  'athlete',
  'musician',
  'influencer',
  'comedian',
  'creator',
  'other',
]);

export const vendorStatusEnum = pgEnum('vendor_status', ['pending', 'active', 'suspended']);

export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);

export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed']);

export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal', 'test']);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid', 'failed']);
