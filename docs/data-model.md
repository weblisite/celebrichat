# Data Model

This document describes the initial database schema managed by Drizzle ORM and compatible with Neon Postgres.

Highlights:
- UUID primary keys generated via gen_random_uuid() (pgcrypto extension)
- Enum types for roles, statuses, and categories
- Timestamps (created_at, updated_at) on all core entities
- Rich relations with foreign keys and indexes
- jsonb metadata on events, payments (raw payload), and payouts

## Entity Relationship Diagram

```mermaid
erDiagram
  USERS ||--o| CELEBRITIES : has
  USERS ||--o| VENDORS : has
  CELEBRITIES ||--o{ EVENTS : performs
  VENDORS ||--o{ EVENTS : organizes
  EVENTS ||--o{ BOOKINGS : has
  USERS ||--o{ BOOKINGS : makes
  BOOKINGS ||--o{ PAYMENTS : generates
  VENDORS ||--o{ PAYOUTS : receives
  CELEBRITIES ||--o{ PAYOUTS : receives
  EVENTS ||--o{ PHOTOS : has

  USERS {
    uuid id PK
    text email UK
    text name
    user_role role
    timestamptz created_at
    timestamptz updated_at
  }
  CELEBRITIES {
    uuid id PK
    uuid user_id FK
    text stage_name
    celebrity_category category
    int price_cents
    boolean available
    timestamptz created_at
    timestamptz updated_at
  }
  VENDORS {
    uuid id PK
    uuid user_id FK
    text company_name
    text stripe_account_id UK
    vendor_status status
    timestamptz created_at
    timestamptz updated_at
  }
  EVENTS {
    uuid id PK
    uuid celebrity_id FK
    uuid vendor_id FK
    text title
    text description
    timestamptz event_date
    text location
    int price_cents
    event_status status
    jsonb metadata
    timestamptz created_at
    timestamptz updated_at
  }
  BOOKINGS {
    uuid id PK
    uuid event_id FK
    uuid user_id FK
    booking_status status
    int quantity
    int total_cents
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
  PAYMENTS {
    uuid id PK
    uuid booking_id FK
    payment_provider provider
    payment_status status
    int amount_cents
    char(3) currency
    text provider_payment_id UK
    jsonb raw_payload
    timestamptz created_at
    timestamptz updated_at
  }
  PAYOUTS {
    uuid id PK
    uuid vendor_id FK
    uuid celebrity_id FK
    payout_status status
    int amount_cents
    char(3) currency
    text provider_payout_id UK
    jsonb metadata
    timestamptz created_at
    timestamptz updated_at
  }
  PHOTOS {
    uuid id PK
    uuid event_id FK
    text url
    text caption
    timestamptz created_at
  }
```

## Enums
- user_role: customer, celebrity, vendor, admin
- celebrity_category: actor, athlete, musician, influencer, comedian, creator, other
- vendor_status: pending, active, suspended
- event_status: draft, published, cancelled, completed
- booking_status: pending, confirmed, cancelled, completed
- payment_provider: stripe, paypal, test
- payment_status: pending, succeeded, failed, refunded
- payout_status: pending, paid, failed

## Migrations
Generated with Drizzle Kit (SQL mode) and designed to be compatible with Neon.

Important Neon notes:
- Use sslmode=require in your DATABASE_URL
- gen_random_uuid() is enabled with the pgcrypto extension (created in the migration)

See README for commands to generate and run migrations.
