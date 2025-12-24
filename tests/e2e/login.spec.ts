import { test, expect } from '@playwright/test';

// Credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'raisada1001@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'alborelle';

export async function login(page) {
  await page.goto('/');
  try {
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 3000 });
  } catch (e) {
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
          console.log('Logging in...');
          await emailInput.fill(TEST_EMAIL);
          await page.fill('input[type="password"]', TEST_PASSWORD);
          await page.click('button[type="submit"]');
          await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
      }
  }
}

test('Login and verify dashboard', async ({ page }) => {
  await login(page);
  await expect(page.getByText('ChefOS').first()).toBeVisible();
});
