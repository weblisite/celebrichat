import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';

// Ensure env var is available in both Node and Next build
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require';

// Pooled connection for long-lived Node processes (e.g., Next.js API routes on Node runtimes)
let pool: Pool | null = null;
export const getPooledDb = () => {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });
  }
  return drizzlePg(pool);
};

// Serverless HTTP connection for edge/serverless runtimes
let neonClient: ReturnType<typeof neon> | null = null;
export const getServerlessDb = () => {
  if (!neonClient) {
    neonClient = neon(DATABASE_URL);
  }
  return drizzleNeon(neonClient);
};

// Convenience default export uses pooled connection in Node by default
export const db = getPooledDb();
export const serverlessDb = getServerlessDb();
