import { test, expect } from '@playwright/test';

// End-to-end happy path: apply -> admin approves -> vendor pays -> event setup visible

test('vendor apply to event setup flow', async ({ page }) => {
  // Apply
  await page.goto('/apply');
  await page.getByLabel('Company Name').fill('Acme Foods');
  await page.getByLabel('Contact Name').fill('Jane Vendor');
  await page.getByLabel('Contact Email').fill('jane.vendor@example.com');
  await page.getByRole('button', { name: /submit application/i }).click();
  await expect(page.getByText('Thanks, Acme Foods!')).toBeVisible();

  // Admin approves
  await page.goto('/admin/vendors?admin=1');
  // Should see Applications list with our company
  await expect(page.getByText('Acme Foods')).toBeVisible();
  // Open details and approve
  await page.getByRole('button', { name: 'Details' }).first().click();
  await page.getByRole('button', { name: /approve/i }).click();
  // Drawer should now show fee due
  await expect(page.getByText('Fee Due:')).toBeVisible();

  // Vendor pays
  await page.goto('/payments');
  await expect(page.getByText(/Outstanding vendor fee/i)).toBeVisible();
  await page.getByRole('button', { name: /pay with paystack/i }).click();
  await expect(page.getByText(/all set! your vendor fee is paid/i)).toBeVisible();

  // Vendor sees event setup instructions
  await page.goto('/event-setup');
  await expect(page.getByRole('heading', { name: /checklist/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /assets/i })).toBeVisible();
});
