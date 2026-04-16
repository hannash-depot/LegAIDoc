/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from '@playwright/test';

/**
 * E2E test fixtures for LegAIDoc.
 * Provides helpers for common operations like login, registration, and navigation.
 */

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Register and login a test user
    const email = `e2e-${Date.now()}@test.com`;
    const password = 'TestPass123';
    const name = 'E2E Test User';

    // Register
    await page.goto('/he/register');
    await page
      .getByLabel(/שם|name/i)
      .first()
      .fill(name);
    await page
      .getByLabel(/אימייל|email/i)
      .first()
      .fill(email);
    await page
      .getByLabel(/סיסמה|password/i)
      .first()
      .fill(password);
    await page.getByRole('button', { name: /הרשמה|register|sign up/i }).click();

    // Wait for redirect to dashboard or templates
    await page.waitForURL(/\/(dashboard|templates)/, { timeout: 15000 });

    await use(page);
  },
});

export { expect };

/**
 * Helper to login with email and password.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/he/login');
  await page
    .getByLabel(/אימייל|email/i)
    .first()
    .fill(email);
  await page
    .getByLabel(/סיסמה|password/i)
    .first()
    .fill(password);
  await page.getByRole('button', { name: /התחברות|login|sign in/i }).click();
  await page.waitForURL(/\/(dashboard|templates)/, { timeout: 15000 });
}
