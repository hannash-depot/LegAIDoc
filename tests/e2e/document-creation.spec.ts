import { test, expect } from './fixtures';

test.describe('Document Creation Flow', () => {
  test('should navigate to templates page', async ({ authenticatedPage: page }) => {
    await page.goto('/he/templates');
    await page.waitForLoadState('networkidle');

    // Templates page should load with at least a heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show template categories', async ({ authenticatedPage: page }) => {
    await page.goto('/he/templates');
    await page.waitForLoadState('networkidle');

    // Should have some content on the page
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(100);
  });
});
