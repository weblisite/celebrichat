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

---

# Testing & QA

This repo includes unit/integration testing with Jest + Testing Library and end-to-end testing with Playwright.

## Unit/Integration (Jest)
- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- CI mode: `npm run test:ci`
- Coverage report: `npm run test:coverage` (reports to `coverage/` and prints summary)

Jest is configured via `jest.config.js` with:
- jsdom environment for React components
- `@/` path alias to `src/`
- RTL + jest-dom setup in `jest.setup.ts`

## End-to-end (Playwright)
- Install browsers (first run): `npm run test:e2e:install`
- Run e2e tests locally: `npm run test:e2e`

Playwright (see `playwright.config.ts`):
- Spins up the Next.js dev server automatically
- Uses `e2e/global-setup.ts` to run DB migrations and seed when `DATABASE_URL` is configured
- Retries and tracing are enabled in CI

E2E Smoke coverage includes:
- Signup ➜ email verification stub flow
- Vendor happy path (apply ➜ admin approves ➜ paystack simulation ➜ setup)
- Admin event creation ➜ fan ticket purchase ➜ webhook simulation ➜ ticket QR display

Note: DB-backed flows are skipped automatically if `DATABASE_URL` is not configured or points at the example Neon URL.

## Mocks for deterministic tests
Utilities are available in `src/test/mocks.ts`:
- `makeSessionCookieValue(session)` to build the session cookie payload
- `makeAdminAuthHeaders()` to emulate Neon Auth RBAC via `x-neon-auth-role`
- `makePaystackSignature(secret, payload)` to sign webhook payloads when needed

In development and tests, the Paystack webhook (`/api/webhooks/paystack`) accepts unsigned payloads unless `NODE_ENV=production`.

---

# CI/CD

GitHub Actions workflow `.github/workflows/ci.yml` enforces:
- Lint + unit/integration tests on every push/PR
- Playwright e2e tests

Database for CI e2e:
- Preferred: provide an ephemeral Neon `DATABASE_URL` via repo/organization secrets. The workflow will use it for migrations and seeds.
- Fallback: when no Neon URL is provided, a Postgres service runs in the CI job and `DATABASE_URL` will default to `postgres://postgres:postgres@localhost:5432/postgres`.

Vercel/GitHub integration:
- Configure Vercel to require GitHub Checks to pass before deploy. With this workflow in place, lint/test gates must pass for PRs before merging and deploying.

## Local environment
- Copy `.env.example` to `.env` and set values as needed
- For Neon, create a branch/DB and set `DATABASE_URL` (include `sslmode=require`)
- Seed demo data: `npm run db:seed`

## Troubleshooting
- If e2e tests skip DB-backed flows, ensure `DATABASE_URL` is set and reachable
- For flaky e2e tests, re-run with headed mode: `npm run test:e2e:headed`
