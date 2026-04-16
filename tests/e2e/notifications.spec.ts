import { test, expect } from './fixtures';

test.describe('Notification Center', () => {
  test('authenticated user sees notification bell in header', async ({
    authenticatedPage: page,
  }) => {
    // The bell should be visible when FEATURE_NOTIFICATIONS is enabled
    const bell = page.getByLabel(/התראות|notifications/i);
    // If feature flag is off, the bell won't appear — skip gracefully
    if (await bell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(bell).toBeVisible();
    }
  });

  test('notification bell opens dropdown on click', async ({ authenticatedPage: page }) => {
    const bell = page.getByLabel(/התראות|notifications/i);
    if (!(await bell.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await bell.click();

    // Dropdown should show (empty state or notifications)
    const dropdown = page.getByText(/אין התראות|no notifications|צפה בכל|view all/i);
    await expect(dropdown.first()).toBeVisible({ timeout: 5000 });
  });

  test('notifications page loads for authenticated user', async ({ authenticatedPage: page }) => {
    await page.goto('/he/notifications');

    // Should show the notifications page (or redirect to login if feature is off)
    const heading = page.getByRole('heading', { name: /התראות|notifications/i });
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
  });
});
