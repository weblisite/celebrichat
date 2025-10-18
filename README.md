# Database Setup (Drizzle ORM + Neon)

This project uses Drizzle ORM with Postgres on Neon. It includes a pooled Node client and a serverless HTTP client, typed schema definitions, SQL migrations, and seed helpers for local development/testing.

## Prerequisites
- Node.js 18+
- Neon Postgres database (or any Postgres instance)
- A DATABASE_URL env var set to your Neon connection string (include `sslmode=require`)

Create a `.env` file based on `.env.example` and set:

```
DATABASE_URL=postgresql://user:password@ep-xxxxxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Drizzle configuration
- drizzle.config.ts defines the Drizzle Kit config (dialect, schema path, output directory)
- SQL migrations are stored in `drizzle/`
- Schema is defined in `src/db/schema/*`

## Commands
- Generate migrations from the schema
  - `npm run db:generate`
- Apply migrations to the database
  - `npm run db:migrate`
- Open Drizzle Studio
  - `npm run db:studio`
- Seed local/test data (uses the pooled Node client)
  - `npm run db:seed`

## Clients
- Pooled Node client (for long-lived Node runtimes): `getPooledDb()` / `db`
- Serverless HTTP client (for Edge/serverless runtimes): `getServerlessDb()` / `serverlessDb`

Both are configured from `src/db/client.ts` and use `process.env.DATABASE_URL`.

## Schema overview
Key entities:
- users, celebrities, vendors
- events, bookings
- payments, payouts
- photos

Design highlights:
- UUID primary keys with `gen_random_uuid()` (pgcrypto)
- Enum types for role and statuses
- Timestamps on core entities
- jsonb for flexible metadata/payloads
- Foreign keys with indexes

For a diagram and more details, see `docs/data-model.md`.
