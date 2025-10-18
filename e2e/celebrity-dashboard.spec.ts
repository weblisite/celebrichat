import { test, expect } from '@playwright/test';

function sessionPayload() {
  const payload = {
    userId: 'celeb-1',
    email: 'star@example.com',
    role: 'celebrity',
    emailVerified: true,
  };
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `session=${json}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

test('celebrity can view schedule, block/unblock slots, and see payouts', async ({ page }) => {
  // Set session cookie before navigation
  await page.context().addCookies([
    { name: 'session', value: sessionPayload().split('=')[1], url: 'http://localhost:3000' },
  ]);

  await page.goto('/celebrity/dashboard');
  await expect(page.getByRole('heading', { name: /celebrity dashboard/i })).toBeVisible();

  // Schedule visible for today
  const today = todayStr();
  await expect(page.getByLabel(new RegExp(`Schedule for ${today}`))).toBeVisible();

  // Find first available slot and block it
  const available = page.getByRole('button', { name: /Available \d{2}:\d{2}/ }).first();
  await expect(available).toBeVisible();
  await available.click();

  // After click, that item should show as blocked
  // Re-query the same slot by time text (extract time from aria-label)
  const label = await available.getAttribute('aria-label');
  const time = label?.split(' ')[1] || '';
  const blocked = page.getByRole('button', { name: new RegExp(`Blocked ${time}`) });
  await expect(blocked).toBeVisible();

  // Unblock it back
  await blocked.click();
  await expect(page.getByRole('button', { name: new RegExp(`Available ${time}`) })).toBeVisible();

  // Earnings cards visible
  await expect(page.getByText(/Paid Payouts/i)).toBeVisible();
  await expect(page.getByText(/Pending Payouts/i)).toBeVisible();

  // Bookings list shows known seeded fan
  await expect(page.getByText(/Alex Fan/)).toBeVisible();
});
