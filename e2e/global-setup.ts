import { execSync } from 'node:child_process';

function hasRealDatabase() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return false;
  return !/ep-example\.neon\.tech/.test(url);
}

async function globalSetup() {
  if (!hasRealDatabase()) {
    // eslint-disable-next-line no-console
    console.log('[e2e setup] No DATABASE_URL configured or using example placeholder. Skipping DB migrate/seed.');
    return;
  }
  try {
    // eslint-disable-next-line no-console
    console.log('[e2e setup] Running database migrations...');
    execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
    // eslint-disable-next-line no-console
    console.log('[e2e setup] Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[e2e setup] Failed to migrate/seed database:', err);
    throw err;
  }
}

export default globalSetup;
