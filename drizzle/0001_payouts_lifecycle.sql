-- Add 'ready' to payout_status enum
DO $$ BEGIN
    ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'ready';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add event_id and paid_at to payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Index on event_id
CREATE INDEX IF NOT EXISTS payouts_event_idx ON payouts (event_id);

-- Unique constraint to prevent race condition: one payout per (event, celebrity)
CREATE UNIQUE INDEX IF NOT EXISTS payouts_event_celebrity_unique ON payouts (event_id, celebrity_id) WHERE event_id IS NOT NULL AND celebrity_id IS NOT NULL;

-- Notifications/logging table for payout lifecycle events
CREATE TABLE IF NOT EXISTS payout_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid REFERENCES payouts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payout_notifications_payout_idx ON payout_notifications (payout_id);
CREATE INDEX IF NOT EXISTS payout_notifications_type_idx ON payout_notifications (type);
