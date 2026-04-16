import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should return healthy status from health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should return locale-specific pages', async ({ page }) => {
    // Hebrew
    await page.goto('/he');
    const heDir = await page.locator('html').getAttribute('dir');
    expect(heDir).toBe('rtl');

    // English
    await page.goto('/en');
    const enDir = await page.locator('html').getAttribute('dir');
    expect(enDir).toBe('ltr');
  });
});
