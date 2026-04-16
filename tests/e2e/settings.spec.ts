import { test, expect } from './fixtures';

test.describe('Settings Page', () => {
  test('should load settings page', async ({ authenticatedPage: page }) => {
    await page.goto('/he/settings');
    await page.waitForLoadState('networkidle');

    // Settings page should load
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display user profile form', async ({ authenticatedPage: page }) => {
    await page.goto('/he/settings');
    await page.waitForLoadState('networkidle');

    // Should have form inputs for profile settings
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });
});
