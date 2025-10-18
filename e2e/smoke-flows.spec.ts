import { test, expect } from '@playwright/test';

function hasRealDatabase() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return false;
  return !/ep-example\.neon\.tech/.test(url);
}

function makeSessionCookie(session: any) {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return payload;
}

// Smoke: signup -> email verification stub (without hitting DB if not configured)
// Uses Verify endpoint to flip the session flag.

test('signup/email verification stub', async ({ page, context }) => {
  const hasDb = hasRealDatabase();
  const email = 'fan@example.com';

  if (!hasDb) {
    // Directly set a fake session cookie with unverified email
    const cookieVal = makeSessionCookie({ userId: 'u_local', email, role: 'fan', emailVerified: false });
    await context.addCookies([{ name: 'session', value: cookieVal, domain: 'localhost', path: '/', httpOnly: true }]);
  } else {
    // Use UI/endpoint to create session
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/check your email to verify/i)).toBeVisible();
  }

  // Visit verify page and click button to mark verified
  await page.goto('/verify-email');
  await page.getByRole('button', { name: /i have verified my email/i }).click();
  await expect(page).toHaveURL(/\/?$/);
});

// Smoke: admin creates event -> fan purchases -> webhook simulation -> QR displayed
// Skipped when no real database configured

test('admin event creation + fan purchase + webhook + QR display', async ({ page }) => {
  test.skip(!hasRealDatabase(), 'Database not configured');

  // Ensure fan session exists and is verified (use login+verify)
  const email = 'smoke-fan@example.com';
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /sign up/i }).click();
  await page.request.post('/api/auth/verify');

  // Admin: fetch first celebrity
  const celebsRes = await page.request.get('/api/celebrities');
  expect(celebsRes.ok()).toBeTruthy();
  const celebsData = await celebsRes.json();
  const celeb = (celebsData?.data || celebsData?.rows || celebsData?.celebrities || [])[0];
  expect(celeb).toBeTruthy();

  // Admin: create event via API
  const createEventRes = await page.request.post('/api/events', {
    headers: { 'x-neon-auth-role': 'admin', 'content-type': 'application/json' },
    data: {
      celebrityId: celeb.id,
      title: 'Smoke Test Event',
      description: 'E2E smoke',
      eventDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      location: 'Test City',
      priceCents: 2500,
      metadata: { tier: 'standard' },
    },
  });
  expect(createEventRes.ok()).toBeTruthy();
  const eventData = await createEventRes.json();
  const event = eventData?.data || eventData?.event || eventData;
  expect(event?.id).toBeTruthy();

  // Fan: create booking
  const bookingRes = await page.request.post('/api/bookings', { data: { eventId: event.id, quantity: 1 } });
  expect(bookingRes.ok()).toBeTruthy();
  const bookingData = await bookingRes.json();
  const booking = bookingData.booking;
  const payment = bookingData.payment;
  expect(booking?.id).toBeTruthy();
  expect(payment?.providerPaymentId).toBeTruthy();

  // Simulate Paystack webhook success
  const webhookRes = await page.request.post('/api/webhooks/paystack', {
    headers: { 'content-type': 'application/json' },
    data: {
      event: 'charge.success',
      data: { reference: payment.providerPaymentId },
    },
  });
  expect(webhookRes.ok()).toBeTruthy();

  // QR display page
  await page.goto(`/tickets/${booking.id}`);
  await expect(page.getByTestId('qr')).toBeVisible();
  await expect(page.getByText(/status/i)).toBeVisible();
});
