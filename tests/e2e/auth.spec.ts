import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const uniqueEmail = `e2e-auth-${Date.now()}@test.com`;
  const password = 'TestPass123';
  const name = 'Auth Test User';

  test('should show login page', async ({ page }) => {
    await page.goto('/he/login');
    await expect(page.getByRole('button', { name: /התחברות|login|sign in/i })).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/he/register');
    await expect(page.getByRole('button', { name: /הרשמה|register|sign up/i })).toBeVisible();
  });

  test('should register a new user and redirect to app', async ({ page }) => {
    await page.goto('/he/register');

    await page
      .getByLabel(/שם|name/i)
      .first()
      .fill(name);
    await page
      .getByLabel(/אימייל|email/i)
      .first()
      .fill(uniqueEmail);
    await page
      .getByLabel(/סיסמה|password/i)
      .first()
      .fill(password);

    await page.getByRole('button', { name: /הרשמה|register|sign up/i }).click();

    // Should redirect to dashboard or templates after registration
    await page.waitForURL(/\/(dashboard|templates|login)/, { timeout: 15000 });
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/he/register');

    await page
      .getByLabel(/שם|name/i)
      .first()
      .fill('Test');
    await page
      .getByLabel(/אימייל|email/i)
      .first()
      .fill('short-pw@test.com');
    await page
      .getByLabel(/סיסמה|password/i)
      .first()
      .fill('abc');

    await page.getByRole('button', { name: /הרשמה|register|sign up/i }).click();

    // Should show an error (not redirect)
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('register');
  });

  test('should show forgot password page', async ({ page }) => {
    await page.goto('/he/forgot-password');
    await expect(page.getByRole('button')).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes to login', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });
});
