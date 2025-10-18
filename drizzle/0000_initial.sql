-- Enable gen_random_uuid for UUID defaults
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'celebrity', 'vendor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE celebrity_category AS ENUM ('actor', 'athlete', 'musician', 'influencer', 'comedian', 'creator', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal', 'test');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS celebrities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  stage_name text NOT NULL,
  bio text,
  category celebrity_category NOT NULL DEFAULT 'other',
  price_cents integer NOT NULL DEFAULT 0,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS celebrities_user_unique ON celebrities (user_id);
CREATE INDEX IF NOT EXISTS celebrities_category_idx ON celebrities (category);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  company_name text NOT NULL,
  stripe_account_id text,
  status vendor_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendors_user_unique ON vendors (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS vendors_stripe_acct_unique ON vendors (stripe_account_id);
CREATE INDEX IF NOT EXISTS vendors_status_idx ON vendors (status);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  price_cents integer NOT NULL DEFAULT 0,
  status event_status NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_celebrity_idx ON events (celebrity_id);
CREATE INDEX IF NOT EXISTS events_vendor_idx ON events (vendor_id);
CREATE INDEX IF NOT EXISTS events_status_idx ON events (status);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status booking_status NOT NULL DEFAULT 'pending',
  quantity integer NOT NULL DEFAULT 1,
  total_cents integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_event_idx ON bookings (event_id);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  provider payment_provider NOT NULL DEFAULT 'stripe',
  status payment_status NOT NULL DEFAULT 'pending',
  amount_cents integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  provider_payment_id text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_unique ON payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
  celebrity_id uuid REFERENCES celebrities(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status payout_status NOT NULL DEFAULT 'pending',
  amount_cents integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  provider_payout_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payouts_recipient_check CHECK ((vendor_id IS NOT NULL) <> (celebrity_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS payouts_vendor_idx ON payouts (vendor_id);
CREATE INDEX IF NOT EXISTS payouts_celebrity_idx ON payouts (celebrity_id);
CREATE UNIQUE INDEX IF NOT EXISTS payouts_provider_payout_unique ON payouts (provider_payout_id);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_event_idx ON photos (event_id);
