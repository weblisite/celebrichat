/*
  Seed script for local development/testing.
  Requires DATABASE_URL to be set to a Neon (or Postgres) connection string.
*/
import 'dotenv/config';
import { clearAll, seedBasic } from './seed/utils';

async function main() {
  await clearAll();
  const data = await seedBasic();
  // eslint-disable-next-line no-console
  console.log('Seeded data:', {
    users: [data.alice.id, data.bob.id, data.vicky.id],
    celebrity: data.celebrity.id,
    vendor: data.vendor.id,
    event: data.event.id,
    booking: data.booking.id,
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
