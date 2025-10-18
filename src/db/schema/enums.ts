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

// Include Paystack as a supported provider for fan payments
export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal', 'paystack', 'test']);

// Include 'initialized' to represent a created-but-not-completed transaction
export const paymentStatusEnum = pgEnum('payment_status', ['initialized', 'pending', 'succeeded', 'failed', 'refunded']);

// Added 'ready' state to support admin review before payout is paid
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'ready', 'paid', 'failed']);
