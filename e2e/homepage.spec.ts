import { test, expect } from '@playwright/test';

test('homepage has hero content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /next\.js 14 app router/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /next\.js docs/i })).toBeVisible();
});
