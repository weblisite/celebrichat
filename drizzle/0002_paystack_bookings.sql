-- Add paystack to payment_provider enum
DO $$ BEGIN
    ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'paystack';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add 'initialized' to payment_status enum
DO $$ BEGIN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'initialized' BEFORE 'pending';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add is_live_chat and qr_token to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_live_chat boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_token text;

-- Unique constraint to enforce idempotent creation per (user, event, is_live_chat)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_event_live_unique ON bookings (user_id, event_id, is_live_chat);
