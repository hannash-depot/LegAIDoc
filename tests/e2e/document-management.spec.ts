import { test, expect } from './fixtures';

test.describe('Document Management', () => {
  test('should load documents list page', async ({ authenticatedPage: page }) => {
    await page.goto('/he/documents');
    await page.waitForLoadState('networkidle');

    // Documents page should load without errors
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show empty state or documents', async ({ authenticatedPage: page }) => {
    await page.goto('/he/documents');
    await page.waitForLoadState('networkidle');

    // Should not show a server error
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('500');
    expect(bodyText).not.toContain('Internal Server Error');
  });
});
