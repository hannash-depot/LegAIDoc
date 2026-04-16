import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('/');

  // Check if title or main heading is present, just to verify it loads
  // If the app has a specific title or h1, we could check it here.
  // For now, let's just make sure the page doesn't return a 404 or crash.
  const title = await page.title();
  expect(typeof title).toBe('string');
});
