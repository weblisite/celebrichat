import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/db/schema/**/*.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require',
  },
  strict: true,
} satisfies Config;
