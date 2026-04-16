import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test('should load pricing page', async ({ page }) => {
    await page.goto('/he/pricing');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('should load terms page', async ({ page }) => {
    await page.goto('/he/terms');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('should load privacy page', async ({ page }) => {
    await page.goto('/he/privacy');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('should load landing page with CTA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Landing page should have some call-to-action links
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThan(0);
  });
});
